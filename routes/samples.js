let express = require("express");
const ObjectId = require("mongoose");
const Location = require("../db/models/location.js");
const Sample = require("../db/models/sample.js");
const moment = require("moment");

router = express.Router();

// Checking if sample exists.
// Throwing error if it isn't, else returning the whole object.

router.get("/samples/existance/:id", async (request, response) => {
  if (ObjectId.isValidObjectId(request.params.id) == false) {
    response.status(500).send();
    return;
  }
  let sample = await Sample.findById(request.params.id);
  let users = await User.find({});
  if (!sample) {
    response.status(500);
  }
  let sampleUser = users?.find((u) => u._id.equals(sample.user));
  let sampleUserName = "";
  if (sampleUser.name) {
    sampleUserName = sampleUser.name;
  } else if (sampleUser.email) {
    sampleUserName = sampleUser.email;
  }
  let returnObject = { sample: sample, userName: sampleUserName };
  response.status(200).send(returnObject);
});

//Requesting all the samles entity in the system based on data filter object.

router.get("/samples", async (request, response) => {
  let dateFilter = request.query.dateFilter;

  let samples = await Sample.find({});
  if (!samples) {
    response.status(500).send({
      message: "No Samples Found",
    });
  }
  let vm = [];
  let locations = await Location.find({});
  let users = await User.find({});
  samples.forEach((t) => {
    vm.push({
      id: t._id.toString(),
      qr: t.qr,
      date: t.time,
      location: locations.find((l) => l._id == t.location.toString())?.name,
      user: users.find((u) => u._id == t.user.toString())?.email,
      name: users.find((u) => u._id == t.user.toString())?.name,
    });
  });

  if (dateFilter) {
    let compareText = "";

    if (dateFilter == 1) {
      compareText = "day";
    }
    if (dateFilter == 2) {
      compareText = "week";
    }
    if (dateFilter == 3) {
      compareText = "month";
    }
    if (compareText != "") {
      vm = vm.filter((t) => moment(t.date).isSame(new Date(), compareText));
    }
  }
  response.status(201).send({
    message: "Sample Created Successfully",
    vm,
  });
});

//Creating a sample
router.post("/samples", async (request, response) => {
  let user = await User.findOne({ email: request.body.user });
  console.log(!user);
  if (!user) {
    response.status(500).send({
      message: "User couldn't be found",
    });
  }

  const sample = new Sample({
    qr: request.body.qr,
    time: moment(new Date()).format("YYYY-MM-DD"),
    note: request.body.note,
    location: request.body.locationId,
    user: user._id,
  });
  await sample
    .save()
    .then((res) => {
      response.status(201).send({
        message: "Sample Created Successfully",
        res,
      });
    })
    .catch((error) => {
      response.status(500).send({
        message: "Error creating Sample",
        error,
      });
    });
});

// Updating a sample
router.put("/samples/:id", async (req, res) => {
  const sample = await Sample.findById(req.params.id);
  if (!sample)
    return res.status(500).send("The sample with the given ID was not found.");
  sample.location = req.body.locationId;
  sample.note = req.body.note;
  const updateSample = await Sample.updateOne({ _id: req.params.id }, sample);
  res.send(sample);
});

module.exports = router;
