const express = require("express"),
  router = express.Router({ mergeParams: true }),
  Camp = require("../models/camp"),
  comment = require("../models/comments"),
  middleware = require("../middleware/warez"),
  moment = require("moment"),
  xss = require("xss");
// =======================================
/**
 * COMMENTS ROUTES
 */
// =======================================

router.get("/new", middleware.checkAuth, (req, res) => {
  Camp.findById(req.params.id, (err, c) => {
    if (err) {
      req.flash("error", "Campground not found");
      res.redirect("/campgrounds/" + req.params.id);
    } else {
      res.render("./comments/new", {
        title: "Comments form",
        css: "/css/comments/form.css",
        camp: c
      });
    }
  });
});

router.post("/", middleware.checkAuth, (req, res) => {
  Camp.findById(req.params.id, (err, camp) => {
    if (err) {
      req.flash("error", "Oops, something went wrong :(");
      res.redirect("/campgrounds");
    } else {
      comment.create(
        {
          text: xss(req.body["text"]),
          author: {
            id: req.user._id,
            username: req.user["username"]
          }
        },
        (err, com) => {
          if (err) {
            req.flash("error", "Oops, something went wrong :(");
            res.redirect("/campgrounds/" + camp._id + "/comments/new");
          } else {
            camp.comments.push(com);
            camp.save();
            req.flash("success", "Comment successfully submitted");
            res.redirect("/campgrounds/" + camp._id);
          }
        }
      );
    }
  });
});

// GET /:commentId/edit
router.get(
  "/:commentId/edit",
  middleware.checkAuth,
  middleware.isCommentOwner,
  (req, res) => {
    comment.findById(req.params.commentId, (err, com) => {
      if (err) {
        req.flash("error", "Comment not found");
        console.log(err);
      } else {
        Camp.findById(req.params.id, (err, camp) => {
          if (err) req.flash("error", "Campground not found");
          res.render("./comments/edit", {
            title: "Edit Your Comment",
            css: "/css/comments/edit.css",
            comment: com,
            camp: camp
          });
        });
      }
    });
  }
);

// PUT /:commentId
router.put(
  "/:commentId",
  middleware.checkAuth,
  middleware.isCommentOwner,
  (req, res) => {
    comment.findByIdAndUpdate(
      req.params.commentId,
      {
        text: xss(req.body.comment["text"]),
        edited: {
          isEdited: true,
          lastEdited: moment(Date.now()).format("l, h:mm:ss a")
        }
      },
      (err, com) => {
        if (err) req.flash("error", "Comment not found");
        Camp.findById(req.params.id, (err, camp) => {
          if (err) req.flash("error", "Campground not found");
          camp.save();
          req.flash("info", "Comment updated");
          res.redirect("/campgrounds/" + req.params.id);
        });
      }
    );
  }
);

// DELETE /:commentId
router.delete(
  "/:commentId",
  middleware.checkAuth,
  middleware.isCommentOwner,
  (req, res) => {
    comment.findByIdAndRemove(req.params.commentId, (err, c) => {
      if (err) req.flash("error", "Comment not found");
      Camp.findById(req.params.id, (err, camp) => {
        camp.save();
        req.flash("success", "Comment successfully deleted");
        res.redirect("/campgrounds/" + camp._id);
      });
    });
  }
);

// comments routes shipped!
module.exports = router;
