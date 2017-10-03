const comment = require("../models/comments"),
  Camp = require("../models/camp");
// middleware to check if the user is authenticated
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash("warning", "You need to be logged in to do that.");
    res.redirect("/login");
  }
}

// middleware to check if the user owns the comment
function isCommentOwner(req, res, next) {
  comment.findById(req.params.commentId, (err, com) => {
    if (err) {
      console.log(err);
      req.flash("error", "Oops, comment not found!");
      res.redirect("back");
    } else if (com.author.id.equals(req.user._id) || req.user.isAdmin) {
      next();
    } else {
      req.flash("error", "You don't seem to be the owner of that post!");
      res.redirect("back");
    }
  });
}

// authorization middleware to edit and delete campgrounds
function isCampOwner(req, res, next) {
  Camp.findById(req.params.id, (err, camp) => {
    if (err) {
      req.flash("error", "Oops, campground not found!");
      res.redirect("back");
      console.log(err);
    }
    if (camp.author.id.equals(req.user._id) || req.user.isAdmin) {
      next();
    } else {
      req.flash("error", "You don't seem to be the owner of that campground!");
      res.redirect("back");
    }
  });
}

// Login only once
function loginOnce(req, res, next) {
  req.isAuthenticated() ? res.redirect("/campgrounds") : next();
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.username === "admin" && req.user.isAdmin) {
      next();
    } else {
      req.flash("error", "You do not have permission to do that");
      res.redirect("/campgrounds");
    }
  }
}

module.exports = {
  checkAuth,
  isCampOwner,
  isCommentOwner,
  loginOnce
};
