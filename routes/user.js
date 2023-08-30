let express = require("express");
router = express.Router();
const auth = require("../auth.js");
const nodemailer = require("nodemailer");
const User = require("../db/models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// register endpoint
router.post("/register", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        name: request.body.name,
        password: hashedPassword,
      });
      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

// authentication endpoint
router.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "You are authorized to access me" });
});

// login endpoint
router.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {
          // check if password matches
          if (!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          //   return success response
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            name: user.name,
            token,
          });
        })
        // catch error if password does not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "Rnr2023proj@gmail.com",
    pass: "gebnsadndwtrmbrh",
  },
});

const mailOptions = {
  from: "Rnr2023proj@gmail.com",
  to: "Rnr2023proj@gmail.com",
  subject: "Water level warning! ",
  text: "The water level is routerroaching the flood threshold",
};

//Sending an email using nodemail to alert the water level
//The logic when to send a mail is managed in the client-side.

router.get("/waterLevelWarning", (req, res) => {
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("error:", error.message);
      return res.status(400).send({
        message: error.message,
      });
    } else {
      return res.status(200);
    }
  });
});

module.exports = router;
