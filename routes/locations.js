let express = require("express");
router = express.Router();
const Location = require("../db/models/location.js");

// Delete location end point

router.delete("/locations/:id", async (req, res) => {
  try {
    await Location.findOneAndRemove({ _id: req.params.id });
    res.status(201).send({
      message: "Location Deleted Sucessfully",
    });
  } catch (ex) {
    throw ex;
  }
});

// Get all locations in the system and map them to a view-model list objects.
router.get("/locations", async (request, response) => {
  try {
    let locations = await Location.find({});
    let vm = [];
    locations.forEach((t) =>
      vm.push({
        id: t._id.toString(),
        name: t.name,
      })
    );
    response.status(201).send({
      res: vm,
    });
  } catch (er) {
    throw er;
  }
});

//Create a new location
router.post("/locations", async (request, response) => {
  const location = new Location({
    name: request.body.name,
  });
  await location
    .save()
    .then((res) => {
      response.status(201).send({
        message: "Location Created Successfully",
        res,
      });
    })
    .catch((error) => {
      response.status(500).send({
        message: "Error creating location",
        error,
      });
    });
});

module.exports = router;
