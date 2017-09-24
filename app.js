const express = require("express"),
  app = express(),
  path = require("path"),
  parser = require("body-parser"),
  passport = require("passport"),
  mongoose = require('mongoose'),
  passportLocal = require("passport-local").Strategy,
  passportLocalMongoose = require("passport-local-mongoose"),
  Camp = require("./models/camp"),
  comment = require("./models/comments"),
  User = require("./models/user"),
  seedDB = require("./seeds"),
  override = require("method-override"),
  // route requires
  commentRoutes = require("./routes/comments"),
  authRoutes = require("./routes/auth"),
  campgroundRoutes = require("./routes/campgrounds"),
  verRoute = require('./routes/google-ver'),
  flash = require("connect-flash"),
  limiter = require("express-rate-limit"),
  helmet = require("helmet"),
  dotenv = require("dotenv").config(),
  favicon = require("serve-favicon");

app.use(favicon(path.join(__dirname, "public", "coconut-tree.png")));

// security measures
app.use(
  helmet({
    referrerPolicy: true
  })
);
//seedDB.seed();
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static(path.join(__dirname, "/public")));
app.use(
  parser.urlencoded({
    extended: true
  })
);
app.use(override("_method"));
// Passport configuration
app.use(
  require("express-session")({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// create a connection to the database
const options = {
  promiseLibrary: global.Promise,
  useMongoClient: true
};

mongoose.connect(`${process.env.DB_URL}`, options, err => {
if (err) console.log(err.name, err.message)
});
mongoose.Promise = global.Promise;

// protect against brute force attacks
const appLimiter = new limiter({
  windowMs: 20 * 60 * 1000,
  max: 10,
  delayMs: 0
});

app.use("/register", appLimiter);
app.use("/login", appLimiter);

//routes
// No cache headers
app.use(function noCache(req, res, next) {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

// pass user and flash messages to each request
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.warning = req.flash("warning");
  res.locals.info = req.flash("info");
  next();
});

// INDEX (GET /)
app.get("/", (req, res) => {
  res.render("index", {
    title: "YelpCamp",
    css: "/css/landing.css"
  });
});

app.use("/campgrounds/:id/comments", commentRoutes);
app.use(authRoutes);
app.use("/campgrounds", campgroundRoutes);

// google verification
app.use('/google*', verRoute);

// 404 route
app.all("*", (req, res) => {
  res.render("404", {
    title: "Resource not found",
    css: "/css/not_found.css"
  });
});

// spin up the server
app.listen(process.env.PORT || 4000, () => {
  console.log("running YelpCamp");
});
