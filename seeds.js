const mongoose = require("mongoose"),
  camp = require("./models/camp"),
  comment = require("./models/comments");

const data = [
  {
    name: "Canyon Camp",
    image: "https://static.pexels.com/photos/558454/pexels-photo-558454.jpeg",
    description:
      "Vestibulizzle ante ipsizzle mah nizzle break yo neck, yall fo shizzle orci luctus izzle ultrices posuere pimpin' Curae; Nizzle mammasay mammasa mamma oo sa rizzle quizzle black crackalackin . That's the shizzle euismod erizzle. Shiz shiz gangster velit. Praesent diam , adipiscing boom shackalack, fo shizzle brizzle, interdizzle vitae, ante. Get down get down you son of a bizzle fo shizzle maurizzle. Sed izzle elit izzle augue porta my shizz. Nam sed fo. Doggy sagittizzle. Bizzle eu things quis lacizzle posuere nizzle. Donec id tellus dawg felis that's the shizzle boofron. Integizzle odio. Nam scelerisque."
  },
  {
    name: "Lake Camp",
    image: "https://static.pexels.com/photos/176381/pexels-photo-176381.jpeg",
    description:
      "Vestibulizzle ante ipsizzle mah nizzle break yo neck, yall fo shizzle orci luctus izzle ultrices posuere pimpin' Curae; Nizzle mammasay mammasa mamma oo sa rizzle quizzle black crackalackin . That's the shizzle euismod erizzle. Shiz shiz gangster velit. Praesent diam , adipiscing boom shackalack, fo shizzle brizzle, interdizzle vitae, ante. Get down get down you son of a bizzle fo shizzle maurizzle. Sed izzle elit izzle augue porta my shizz. Nam sed fo. Doggy sagittizzle. Bizzle eu things quis lacizzle posuere nizzle. Donec id tellus dawg felis that's the shizzle boofron. Integizzle odio. Nam scelerisque."
  },
  {
    name: "Forest Camp",
    image:
      "https://static.pexels.com/photos/6714/light-forest-trees-morning.jpg",
    description:
      "Vestibulizzle ante ipsizzle mah nizzle break yo neck, yall fo shizzle orci luctus izzle ultrices posuere pimpin' Curae; Nizzle mammasay mammasa mamma oo sa rizzle quizzle black crackalackin . That's the shizzle euismod erizzle. Shiz shiz gangster velit. Praesent diam , adipiscing boom shackalack, fo shizzle brizzle, interdizzle vitae, ante. Get down get down you son of a bizzle fo shizzle maurizzle. Sed izzle elit izzle augue porta my shizz. Nam sed fo. Doggy sagittizzle. Bizzle eu things quis lacizzle posuere nizzle. Donec id tellus dawg felis that's the shizzle boofron. Integizzle odio. Nam scelerisque."
  }
];
let seed = function() {
  camp.remove({}, err => {
    if (err) console.log(err);
    comment.remove({}, err => {
      if (err) console.log(err);
      camp.create(data, (err, camps) => {
        if (err) console.log(err);
        camps.forEach(c => {
          console.log("Created camp" + "\n" + c);
          comment.create(
            [
              {
                text:
                  "This is a great place, but I wish there was internet and mcdonalds...",
                author: "Homer"
              },
              {
                text: "Yay let's set dad's ass on fire!",
                author: "Bart"
              },
              {
                text: "Hmm...nice place to relax and read some books",
                author: "Lisa"
              },
              {
                text: "It's nice to get in touch with nature",
                author: "Margie"
              }
            ],
            (err, com) => {
              if (err) console.log(err);
              com.forEach(co => {
                c.comments.push(co);
              });
              c.save();
            }
          );
        });
      });
    });
  });
};

module.exports = { seed };
