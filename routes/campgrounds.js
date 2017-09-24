const express = require("express"),
  router = express.Router(),
  Camp = require("../models/camp"),
  middleware = require("../middleware/warez"),
  geocoder = require("geocoder"),
  xss = require("xss");

// =======================================
/**
 * CAMPGROUND ROUTES
 */
// =======================================

router.get("/", (req, res) => {
  Camp.find({}, (err, camp) => {
    if (err) console.log(err);
    res.render("./campgrounds/campgrounds", {
      title: "Campgrounds",
      css: "/css/campgrounds.css",
      campgrounds: camp
    });
  });
});

//res.redirect("/campgrounds");

// NEW (GET /campgrounds/new) -> get form to create new camp
// MUST BE DECLARED BEFORE GET /campgrounds/:id, OTHERWISE
// IT GETS OVERWRITTEN
router.get("/new", middleware.checkAuth, (req, res) => {
  res.render("./campgrounds/add", {
    title: "Add a campground",
    css: "/css/add.css"
  });
});

// CREATE (POST /campgrounds) -> send post request for new camp

router.post("/", middleware.checkAuth, (req, res) => {
  let campName = xss(req.body.name);
  let campImg = xss(req.body.img);
  let campDesc = xss(req.body.description);
  let campPrice = xss(req.body.price);

  // validate price for extra safety before sending for db validation
  if (
    !/^\d{1,4}\.?\d{0,2}$/.test(campPrice.trim()) ||
    /^\d{5,}/.test(campPrice.trim())
  ) {
    req.flash(
      "error",
      "The campground price must follow the format: (1-4 numbers).(0-2 numbers)"
    );
    return res.redirect("/campgrounds");
  }
  if (/^\d{1,4}\.$/.test(campPrice.trim())) {
    campPrice += "00";
  }

  geocoder.geocode(req.body.location, (err, data) => {
    if (err || !data.results[0]) {
      req.flash("error", "Sorry, the specified location could not be found :(");
      res.redirect("/campgrounds");
    } else {
      let lat = data.results[0].geometry.location.lat;
      let lng = data.results[0].geometry.location.lng;
      let locationName = data.results[0].formatted_address;

      let location = {
        name: locationName,
        coords: {
          lat: lat,
          long: lng
        }
      };

      Camp.create(
        {
          name: campName,
          image: campImg,
          description: campDesc,
          price: campPrice,
          author: {
            id: req.user._id,
            username: req.user["username"]
          },
          location: location
        },
        (err, camp) => {
          if (err) req.flash("error", "Oops, something went wrong :(");
          res.redirect("/campgrounds");
        }
      );
    }
  });
});

// SHOW (GET /campgrounds/:id) -> get info about a particular camp
// MUST BE DECLARED AFTER ALL OTHER ROUTES
router.get("/:id", (req, res) => {
  let isAdmin = false;
  if (req.user) {
    if (req.user.isAdmin) {
      isAdmin = true;
    }
  }
  Camp.findById(req.params.id)
    .populate("comments")
    .exec((err, camp) => {
      if (err || !camp) {
        req.flash("error", "Campground not found");
        return res.redirect("/campgrounds");
      }
      res.render("./campgrounds/show", {
        css: "/css/show.css",
        title: camp["name"],
        camp: camp,
        isAdmin: isAdmin
      });
    });
});

// GET /campgrounds/:id/edit
router.get(
  "/:id/edit",
  middleware.checkAuth,
  middleware.isCampOwner,
  (req, res) => {
    Camp.findById(req.params.id, (err, camp) => {
      if (err || !camp) {
        req.flash("error", "Campground not found");
        res.redirect("/campgrounds");
      }
      res.render("./campgrounds/edit", {
        css: "/css/edit.css",
        title: "Edit " + camp["name"],
        camp: camp
      });
    });
  }
);

router.put("/:id", middleware.checkAuth, middleware.isCampOwner, (req, res) => {
  let campPrice = xss(req.body.price);
  // validate price for extra safety before sending for db validation
  if (
    !/^\d{1,4}\.?\d{0,2}$/.test(campPrice.trim()) ||
    /^\d{5,}/.test(campPrice.trim())
  ) {
    req.flash(
      "error",
      "The campground price must follow the format: (1-4 numbers).(0-2 numbers)"
    );
    return res.redirect("/campgrounds/" + req.params.id);
  }
  if (/^\d{1,4}\.$/.test(campPrice.trim())) {
    campPrice += "00";
  }

  geocoder.geocode(req.body.location, (err, data) => {
    if (err || !data.results[0]) {
      req.flash("error", "Sorry, the specified location could not be found :(");
      return res.redirect("/campgrounds");
    }
    let lat = data.results[0].geometry.location.lat;
    let lng = data.results[0].geometry.location.lng;
    let locationName = data.results[0].formatted_address;

    let location = {
      name: locationName,
      coords: {
        lat: lat,
        long: lng
      }
    };

    Camp.findByIdAndUpdate(req.params.id, {
      name: xss(req.body.name),
      image: xss(req.body.img),
      description: xss(req.body.description),
      price: campPrice,
      location: xss(location)
    })
      .exec()
      .then(camp => {
        req.flash("success", "Campground successfully updated");
        res.redirect("/campgrounds/" + camp._id);
      })
      .catch(err => {
        if (err) req.flash("error", "Oops, something went wrong :(");
        res.redirect("/campgrounds");
      });
  });
});

// DELETE /campgrounds/:id
router.delete(
  "/:id",
  middleware.checkAuth,
  middleware.isCampOwner,
  (req, res) => {
    Camp.findByIdAndRemove(req.params.id, err => {
      if (err) {
        req.flash("error", "Oops, something went wrong :(");
        res.redirect("/campgrounds");
      } else {
        res.redirect("/campgrounds");
      }
    });
  }
);

// campgrounds routes shipped!
module.exports = router;
