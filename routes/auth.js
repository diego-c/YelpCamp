const express = require("express"),
  router = express.Router(),
  User = require("../models/user"),
  passport = require("passport"),
  middleware = require("../middleware/warez"),
  util = require('util'),
  bluebird = require('bluebird'),
  async = require("async"),
  crypto = require("crypto"),
  mailer = require("nodemailer"),
  //mailjet = require('node-mailjet').connect(process.env.MAIL_KEY, process.env.MAIL_SECRET)
  xss = require("xss");
// ==============================
/**
 * AUTH ROUTES
 */
// ==============================

// GET /register
router.get("/register", (req, res) => {
  res.render("./users/register", {
    css: "./css/auth/register.css",
    title: "Register"
  });
});

// POST /register
router.post("/register", (req, res) => {
  if (!req.body.username.trim() || !req.body.password.trim()) {
    req.flash("error", "Invalid username and/or password");
    return res.redirect("/register");
  }
  if (
    !req.body.email.trim() ||
    !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      req.body.email.trim()
    )
  ) {
    req.flash("error", "Invalid email");
    return res.redirect("/register");
  }

  User.register(
    new User({
      username: xss(req.body.username),
      email: xss(req.body.email)
    }),
    req.body.password,
    (err, user) => {
      if (err) {
        req.flash("warning", err.message);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          req.flash(
            "success",
            "Thanks for signing up, " + user.username + " !"
          );
          res.redirect("/campgrounds");
        });
      }
    }
  );
});

// GET /login
router.get("/login", middleware.loginOnce, (req, res) => {
  res.render("./users/login", {
    css: "./css/auth/login.css",
    title: "Login"
  });
});

// POST /login
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Wrong username/password combination"
  }),
  (req, res) => {
    req.flash("success", "Welcome back, " + req.user.username + " !");
    res.redirect("/campgrounds");
  }
);

// GET /logout
router.get("/logout", (req, res) => {
  if (req.user) {
    req.flash("info", `See you soon, ${req.user.username} ;)`);
  }
  req.logout();
  res.redirect("/campgrounds");
});

// Forgot password?
// GET /forgot
router.get("/forgot", (req, res) => {
  res.render("./users/forgot", {
    css: "./css/auth/forgot.css",
    title: "Recover password"
  });
});

// send request for token to change the password
// POST /forgot

router.post("/forgot", (req, res, next) => {

  return new Promise((resolve, reject) => {
    // since util is only present on node v8+ environments, we can use this bluebird polyfill
    // const randomBytes = bluebird.promisfy(crypto.randomBytes);
    const randomBytes = util.promisify(crypto.randomBytes);
    randomBytes(20)
    .then(buf => {
      let token = buf.toString('hex');
      return resolve(token);
    }, err => {
      console.error(`Could not create random bytes\n${err}`);
      req.flash("error", "Oops, something went wrong! Please try again later.");
      return res.redirect("/forgot");
    })
  })
    .then(token => {
      return new Promise((resolve, reject) => {
        User.findOne({
        email: req.body.email
      })
      .exec()
      .then(user => {
        if (!user) {
          req.flash("error","No account with the specified e-mail address was found");
          return res.redirect("/forgot");
          console.error(`Could not find user\n${err}`);
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 15;
        return new Promise((resolve, reject) => {
          user.save().then(user => {
              // we have access to the user and the token here!
              // if you wanna do something with the token, do it here!
               let smtpTransport = mailer.createTransport({
              service: 'Gmail',
              auth: {
              user: process.env.MAIL_ACC,
              pass: process.env.MAIL_PASS
              }
          });
        let mailOptions = {
          to: user.email,
          from: "YelpCamp Demo",
          subject: "YelpCamp password reset",
          text: 
          `Hello, ${user.username}. You are receiving this e-mail because you (or someone else) requested a password reset for YelpCamp.
            
          Click on the following link to proceed:
            
          http://${req.headers.host}/reset/${token}/
            
          If you did not request this, please ignore or delete this email.`
        };
         smtpTransport.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.log(`Could not send email: ${err}`);
            return reject(err);
          }
          req.flash(
            "success",
            `An email has been sent for ${user.email} with further instructions`
          );
          return res.redirect("/campgrounds");
        })
        }, err => {
              console.error(`Couldn't save user!\n`);
              req.flash("error", "Oops, something went wrong! Please try again later.");
              return res.redirect("/forgot");
          })
        })
        .catch(err => {
          console.error(`Handled error: ${err}`);
        })           
      })              
      })
    })                   
    .catch(err => {
      console.error("Caught an error at the end\n" + err);
      req.flash("error", "Oops, something went wrong! Please try again later.");
      return res.redirect("/forgot");
    })
})

// get the page to reset the password
// GET /reset/:token
router.get('/reset/:token', (req, res) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  })
  .exec()
  .then(user => {
    if (!user) {
      req.flash("error", "Your password token is invalid or has expired, please try again");
      return res.redirect('/forgot');
    }
    res.render('./users/reset', {
      title: 'Reset your password',
      css: "./css/auth/reset.css",
      token: req.params.token
    })
  })
  .catch(err => {
    req.flash("error", "Oops, something went wrong. Please try again later");
    return res.redirect('/forgot');
  })
})

// send POST request to change the password
// POST /reset/:token
router.post('/reset/:token', (req, res) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  })
  .exec()
  .then(user => {
    if (!user) {
      req.flash("error", "Your password token is invalid or has expired, please try again");
      return res.redirect('/forgot');
    }
    if (req.body.password === req.body.confirm) {
      user.setPassword(req.body.password, err => {
        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;
        if (err) {
          req.flash("error", "Sorry, you password could not be changed at this time. Please try again later");
          return res.redirect('/campgrounds');
        }
        return new Promise((resolve, reject) => {
          user.save().then(user => {
            req.logIn(user, err => {
              return resolve(user);
            })
          }, err => {
            reject(err);
          })
        })
        .then(user => {
          req.flash("success", "Your password has been changed!");
          res.redirect("/campgrounds");
        })
        .catch(err => {
          req.flash("error", "Sorry, you password could not be changed at this time. Please try again later");
          return res.redirect('/campgrounds');
        })              
      })
    } 
  })   
})
  
// auth routes shipped!
module.exports = router;
