let express = require("express");
router = express.Router();
const Sample = require("../db/models/sample.js");
const Tube = require("../db/models/tube");
const ObjectId = require("mongoose");
const moment = require("moment");

// This endpoint contains graph one logic, fetching all samples with the relevant data.
app.get("/graph_t1", async (request, response) => {
  let tubes = await Tube.find();
  let samples = await Sample.find();
  let vm = [];
  tubes.forEach((t) => {
    let sampleByTube = samples.find(
      (s) => s._id.toString() == t.sampleId.toString()
    );
    if (sampleByTube) {
      if (!sampleByTube.time) {
        console.log(sampleByTube);
      }
      vm.push({
        type: t.type,
        value: t.value,
        sampleId: {
          location: sampleByTube.location,
          time: sampleByTube.time,
          _id: sampleByTube._id,
        },
      });
    } else {
      console.log("fail");
    }
  });
  response.status(200).send(vm);
});

// Graph method that uses queryparamters as filters.
app.get(
  "/overview/tubes/:locationId/:typeId/:from/:to",
  async (request, response) => {
    let vmObject = [];
    let formDate = moment(request.params.from);
    let toDate = moment(request.params.to);
    if (
      ObjectId.isValidObjectId(request.params.locationId) &&
      ObjectId.isValidObjectId(request.params.typeId)
    ) {
      const samples = await Sample.find({
        location: request.params.locationId,
      });
      const tubes = await Tube.find({ type: request.params.typeId });
      while (formDate.isSameOrAfter(toDate) == false) {
        let val = 0;

        samples.forEach((sample) => {
          if (moment(sample.time).isSame(formDate, "day")) {
            let relevantTubes = tubes.filter((x) =>
              x.sampleId.equals(sample._id)
            );
            if (relevantTubes) {
              relevantTubes.forEach((t) => (val += t.value));
            }
          }
        });
        vmObject.push({
          date: moment(formDate).format("YYYY-MM-DD"),
          value: val,
        });
        formDate = moment(formDate).add("days", 1);
      }
      response.status(200).send(vmObject);
    } else {
      response.status(500).send();
    }
  }
);

//Graph3 endpoint
app.get("/graph_t3", async (req, res) => {
  const p = [
    {
      $lookup: {
        from: "tubes",
        localField: "_id",
        foreignField: "sampleId",
        as: "tubes",
      },
    },
    {
      $match: {
        location: new ObjectId.Types.ObjectId(req.query.location),
        time: {
          $gte: new Date(`${req.query.from}-01-01T00:00:00.000Z`),
          $lte: new Date(`${req.query.to}-12-31T23:59:59.999Z`),
        },
        "tubes.type": new ObjectId.Types.ObjectId(req.query.tubeType),
      },
    },
  ];
  const result = await Sample.aggregate(p);
  res.send(result);
});

module.exports = router;
