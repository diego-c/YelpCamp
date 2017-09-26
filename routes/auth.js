const express = require("express"),
  router = express.Router(),
  User = require("../models/user"),
  passport = require("passport"),
  middleware = require("../middleware/warez"),
  util = require('util'),
  async = require("async"),
  crypto = require("crypto"),
  mailer = require("nodemailer"),
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

// testing /forgot route
router.post("/forgot", (req, res, next) => {

  return new Promise((resolve, reject) => {
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
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 15;
        return new Promise((resolve, reject) => {
          user.save().then(user => {
              // we have access to the user and the token here!
              // if you wanna do something with the token, do it here!
              return resolve(user);
          }, err => {
              console.error(`Couldn't save user!\n`);
              req.flash("error", "Oops, something went wrong! Please try again later.");
              return res.redirect("/forgot");
          })
        })
        .then(user => {
          // we only have access to the user here
          // could use User.findOne(user).exec().then(user => user.resetPasswordToken), but it's not ideal!
          req.flash("warning", `Sorry, ${user.username}, the feature is yet to be implemented`);
          return res.redirect('/campgrounds');          
        })        
      }, err => {
        req.flash("error","No account with the specified e-mail address was found");
        return res.redirect("/forgot");
        console.error(`Could not find user\n${err}`);        
      })              
      })
    })                   
    .catch(err => {
      console.error("Caught an error at the end\n" + err);
      req.flash("error", "Oops, something went wrong! Please try again later.");
      return res.redirect("/forgot");
    })
    })
     
  

/*
router.post("/forgot", (req, res) => {
  res.send(
    "This is just a placeholder response, this feature will be properly implemented in the future"
  );
});
*/

// auth routes shipped!
module.exports = router;
