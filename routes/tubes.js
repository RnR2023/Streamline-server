let express = require("express");
const excelJS = require("exceljs");
const TubeType = require("../db/models/tubeType");
const Location = require("../db/models/location.js");
const Sample = require("../db/models/sample.js");
const Tube = require("../db/models/tube");
const ObjectId = require("mongoose");
const moment = require("moment");
router = express.Router();

//Http get method that returns excel data using ExcelJS library, the paramter is sent is the sampleId
// Fetching all relevant data and orgainzing into excel cells.
router.get("/tubes/excel/:id", async (req, res) => {
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const workSheetSample = workbook.addWorksheet("Sample");
  const worksheet = workbook.addWorksheet("My Tubes"); // New Worksheet
  if (ObjectId.isValidObjectId(req.params.id) == false) {
    response.status(500).send();
    return;
  }
  let sample = await Sample.findById(req.params.id);
  let location = await Location.find({});
  let users = await User.find({});
  if (!sample) {
    response.status(500).send();
  }

  let sampleVM = {
    id: sample._id,
    time: moment(sample.time).format("DD/MM/YYYY"),
    location: location.find(
      (x) => x._id.toString() == sample.location.toString()
    )?.name,
    note: sample.note,
    name: users.find((u) => u._id == sample.user.toString())?.name,
  };

  workSheetSample.columns = [
    { header: "name", key: "name", width: 10 },
    { header: "time", key: "time", width: 10 },
    { header: "location", key: "location", width: 10 },
    { header: "note", key: "note", width: 10 },
  ];
  workSheetSample.addRow(sampleVM);
  worksheet.columns = [
    { header: "name", key: "typeName", width: 10 },
    { header: "value", key: "value", width: 10 },
  ];

  let vm = await tubesToVm(sample);
  vm.forEach((tube) => {
    worksheet.addRow(tube);
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  workSheetSample.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  try {
    res.status(200);
    res.setHeader("Content-Type", "text/xlsx");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${sampleVM.time}.xlsx`
    );
    res.status(200);

    await workbook.xlsx.write(res).then(() => {
      res.send();
    });
  } catch (err) {
    console.log(err);
    res.send({
      status: "error",
      message: "Something went wrong",
    });
  }
});

//Adding a new tube to sample entity, the method is replacing the old list with a new list of samples to avoid "upsert logic".
router.post("/samples/:id/tubes", async (req, res) => {
  const sample = await Sample.findById(req.params.id);
  if (!sample) {
    res.status(500).send();
    return;
  }
  await Tube.deleteMany({ sampleId: sample._id });
  let toInsert = [];
  req.body.tubes.forEach(async (element) => {
    toInsert.push(
      new Tube({
        type: element.typeId,
        value: element.value,
        sampleId: sample._id,
      })
    );
  });
  await Tube.insertMany(toInsert);
  res.status(200).send();
});

// Get tubes by sample Id
router.get("/samples/:id/tubes", async (request, response) => {
  if (ObjectId.isValidObjectId(request.params.id) == false) {
    response.status(500).send();
    return;
  }
  let sample = await Sample.findById(request.params.id);
  if (!sample) {
    response.status(500).send();
  }
  if (sample.tubes && sample.tubes.length > 0) {
  } else {
    let vm = await tubesToVm(sample);

    response.status(200).send({
      vm,
    });
  }
});

//Get all tube types
router.get("/tubes/types", async (request, response) => {
  try {
    let types = await TubeType.find({});
    let vm = [];

    types.forEach((t) =>
      vm.push({
        id: t._id.toString(),
        name: t.name,
        min: t.min,
        max: t.max,
      })
    );

    response.status(201).send({
      res: vm,
    });
  } catch (er) {
    throw er;
  }
});

// Get all tubes
router.get("/tubes", async (request, response) => {
  let tubes = await Tube.find({});
  let tubeTypes = await TubeType.find({});
  tubes.forEach((tube) => {});
  response.status(201).send({
    message: "Tube Created Sucessfully",
    tubes,
  });
});

// Update tube type by his Id.
router.put("/tubes/types/:id", async (req, res) => {
  const type = await TubeType.findById(req.params.id);
  if (!type)
    return res.status(500).send("The tube with the given ID was not found.");
  type.name = req.body.name;
  type.min = req.body.min;
  type.max = req.body.max;
  const updatetype = await TubeType.updateOne({ _id: req.params.id }, type);
  res.send(updatetype);
});

//Delete tube type
router.delete("/tubes/types/:id", async (req, res) => {
  try {
    await TubeType.findOneAndRemove({ _id: req.params.id });
    res.status(201).send({
      message: "Type Deleted Sucessfully",
    });
  } catch (ex) {
    throw ex;
  }
});

//Add tube type
router.post("/tubes/types", async (request, response) => {
  const type = new TubeType({
    name: request.body.name,
    min: request.body.min,
    max: request.body.max,
  });

  await type
    .save()
    .then((res) => {
      response.status(201).send({
        message: "Type Created Successfully",
        res,
      });
    })
    .catch((error) => {
      response.status(500).send({
        message: "Error creating tube type",
        error,
      });
    });
});

//Extension method that maps data models tubes  into a view models tubes.
//We built this extension to avoid code duplication

tubesToVm = async (sample) => {
  let tubeType = await TubeType.find({});
  let tube = await Tube.find({ sampleId: sample._id });
  let vm = [];
  tubeType.forEach((t) => {
    let randomNumber = Math.random(0, 9999);
    let tubesValues = tube?.filter(
      (tube) => tube.type.toString() == t._id.toString()
    );
    if (tubesValues.length > 0) {
      tubesValues.forEach((tubeValue) => {
        vm.push({
          value: tubeValue ? tubeValue.value : 0,
          typeId: t._id.toString(),
          typeName: t.name,
          id: tubeValue._id,
          min: t.min,
          max: t.max,
          hasMinMaxValues: t.min > 0 || t.max > 0,
        });
      });
    } else {
      vm.push({
        value: 0,
        typeId: t._id.toString(),
        typeName: t.name,
        id: randomNumber,
        min: t.min,
        max: t.max,
        hasMinMaxValues: t.min > 0 || t.max > 0,
      });
    }
  });
  return vm;
};

module.exports = router;
