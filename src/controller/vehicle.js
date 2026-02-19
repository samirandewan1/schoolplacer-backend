import { ObjectId } from "mongodb";
import { createVehicleSchema, updateVehicleSchema, deleteVehicleSchema, viewVehiclesSchema  } from "../validator/trackerSchema.js";
import {actionLog, parseBool} from "../utils/helper.js";
import { getDb } from "../config/mongo.js";


export const createVehicle = async(req, res) => {
   try {
    const form                = req.body?.data?.form;
    const { initiator, role } = req;

    await actionLog(form, initiator, role, "createVehicle");

    const { error, value } = createVehicleSchema.validate(form, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "failure",
        message: error.details.map(d => d.message),
      });
    }
  //console.log('value: '+JSON.stringify({ organizationId: value.organizationId, status: 'active' }));
  const db = getDb();

  // Resolve organization
  const org = await db.collection('organization').findOne(
    { _id: new ObjectId(value.organizationId), status: 'active' },
    { projection: { name: 1 } }
  );
  if (!org) {
      return res.status(404).json({ status: "failure", message: "Organization not found" });
    }


  const vehRegnoString  = value.regno;
  console.log(vehRegnoString);
  // Check vehicle uniqueness
  const vehicleExists = await db.collection('organization_vehicle').findOne({
    regno: vehRegnoString,
    organizationId: value.organizationId,
    status        : 'active',
  });
  if (vehicleExists) {
      return res.status(409).json({ status: "failure", message: "Vehicle with this registration already exists" });
    }

    const { acknowledged, insertedId } = await db.collection("organization_vehicle").insertOne(value);
    if (!acknowledged) {
      return res.status(500).json({ status: "failure", message: "Failed to insert the record" });
    }

    return res.status(201).json({ status: "success", vehicleId: insertedId });
 }catch (error) {
    console.error(`[createVehicle] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
}


export const updateVehicle = async(req, res) =>{

   try {
    const form                = req.body?.data?.form;
    const filterBy            = req.body?.data?.filter;
    const { initiator, role } = req;

    if (!filterBy?.vehicleId || !filterBy?.organizationId) {
      return res.status(400).json({ status: "failure", message: "Missing filter fields" });
    }

    if (!ObjectId.isValid(filterBy.vehicleId)) {
      return res.status(400).json({ status: "failure", message: "Invalid vehicleId" });
    }

    await actionLog(form, initiator, role, "updateVehicle");
    const { error, value } = updateVehicleSchema.validate(form, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "failure",
        message: error.details.map(d => d.message),
      });
    }


  const db      = getDb();
  
  const result = await db.collection('organization_vehicle').updateOne(
    { _id : new ObjectId(filterBy.vehicleId), organizationId: filterBy.organizationId },
    { $set: value }
  );
   if (result.matchedCount === 0) {
      return res.status(404).json({ status: "failure", message: "Vehicle not found" });
    }

    return res.status(200).json({ status: "success", vehicleId: filterBy.vehicleId });
}catch (error) {
    console.error(`[updateVehicle] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
}
}


export const deleteVehicle = async (req, res) => {
  try {
    const vehicleData         = req.body?.data?.form;
    const { initiator, role } = req;

    await actionLog(vehicleData, initiator, role, "deleteVehicle");

    const { error, value } = deleteVehicleSchema.validate(vehicleData, { abortEarly: false });
    if (error) {
      return res.status(400).json({ status: "failure", message: "Missing required fields" });
    }

  const db = getDb();

  const vehicleExists = await db.collection('organization_vehicle').countDocuments({
    _id     : new ObjectId(value.vehicleId),
    organizationId: value.organizationId,
    $or           : [{ status: 'active' }, { status: 'inactive' }],
  });
  if (vehicleExists === 0) {
      return res.status(404).json({ status: "failure", message: "Vehicle not found" });
    }

  await db.collection('organization_vehicle').updateOne(
    { _id: new ObjectId(value.vehicleId), organizationId: value.organizationId },
    { $set: { status: 'hold' } }
  );

  return res.status(200).json({ status: 'success', vehicleId: value.vehicleId });
}catch (error) {
    console.error(`[deleteVehicle] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
}
}

export const removeVehicle = async(req, res) => {
  try{
  const vehicleData         = req.body?.data?.form;
    const { initiator, role } = req;

    await actionLog(vehicleData, initiator, role, "removeVehicle");

    const { error, value } = deleteVehicleSchema.validate(vehicleData, { abortEarly: false });
    if (error) {
      return res.status(400).json({ status: "failure", message: "Missing required fields" });
    }

  const db = getDb();

  const vehicleExists = await db.collection('organization_vehicle').countDocuments({
    _id     : new ObjectId(value.vehicleId),
    organizationId: value.organizationId,
  });
  if (vehicleExists === 0) return res.json({ status: 'failure', message: 'no ve' });

  await db.collection('organization_vehicle').deleteOne({
   _id     : new ObjectId(value.vehicleId),
    organizationId: value.organizationId,
  });

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}catch (error) {
    console.error(`[removeVehicle] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
}
}


  export const viewVehicles = async (req, res) =>{
    try{
    const vehicleData = req.body.data?.form;
    const filterBy = req.body.data?.filter || {};
    const extra    = req.body.data?.extra  || {};
    const { initiator, role} = req;

  await actionLog(vehicleData, initiator, role, 'viewVehicles');
  const { error } = viewVehiclesSchema.validate(vehicleData, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const limit     = 25;
  const pageIndex = extra.pageIndex > 0 ? extra.pageIndex : 0;
  const pageJump  = extra.pageJump ? extra.pageJump * limit : pageIndex;
  const skip      = pageJump > 0 ? pageJump : pageIndex;
  const sort      = extra.orderByDateCreated === '-1' ? { logTimeMS: -1 } : {};

  const db          = getDb();
  const searchQuery = { organizationId: filterBy.organizationId };

  if (filterBy.vehicleId) searchQuery.vehicleId = filterBy.vehicleId;
  if (filterBy.regno)     searchQuery['vehicleInformation.regno'] = new RegExp(filterBy.regno, 'i');
  searchQuery.status = filterBy.status || 'active';

  const docs = await db.collection('organization_vehicle')
    .find(searchQuery, { projection: { _id: 0 } })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();

  return res.json({ status: 'success', response: docs });
}catch (error) {
    console.error(`[viewVehicle] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
}
}