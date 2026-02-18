import { ObjectId } from "mongodb";
import { createVehicleSchema, updateVehicleSchema, deleteVehicleSchema, viewVehiclesSchema  } from "../validator/trackerSchema.js";
import {actionLog, parseBool} from "../utils/helper.js";
import { getDb } from "../config/mongo.js";


export const createVehicle = async(req, res) => {
//   const { postdata, userTracker } = req;
//   const form = postdata?.form;
   const vehicleData = req.body.data?.form;
    const { initiator, role} = req;

  await actionLog(vehicleData, initiator, role, 'createVehicle');

  const { error, value } = createVehicleSchema.validate(vehicleData, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const db = getDb();

  // Resolve organization
  const org = await db.collection('organization').findOne(
    { organizationId: value.organizationId, status: 'active' },
    { projection: { orgRefNo: 1 } }
  );
  if (!org) return res.json({ status: 'failure', ec: 'SCno organization found' });

//   const vehRegnoString = value.vehicleInformation.regno.replace(/[^A-Za-z0-9]/g, '');
//   const vehicleId      = String(org.orgRefNo) + vehRegnoString;

  // Check vehicle uniqueness
  const vehicleExists = await db.collection('organization_vehicle').findOne({
    vehicleId,
    organizationId: value.organizationId,
    status        : 'active',
  });
  if (vehicleExists) return res.json({ status: 'failure', ec: 'already exists' });

  const vi = value.vehicleInformation;

  const document = {
    vehicleId,
    organizationId      : value.organizationId,
    vehicleInformation  : {
      name                 : vi.name,
      regno                : vi.regno,
      type                 : vi.type                  || '',
      make                 : vi.make                  || '',
      model                : vi.model                 || '',
      tabDeviceName        : vi.tabDeviceName          || '',
      ownerName            : vi.ownerName              || '',
      ownerPhone           : vi.ownerPhone             || '',
      ownerAddress         : vi.ownerAddress           || '',
      manufactureYear      : vi.manufactureYear        || '',
      purchasedYear        : vi.purchasedYear          || '',
      color                : vi.color                  || '',
      fuel                 : vi.fuel                   || '',
      engineNumber         : vi.engineNumber           || '',
      chasisNumber         : vi.chasisNumber           || '',
      insuranceCompany     : vi.insuranceCompany       || '',
      insurancePolicyNumber: vi.insurancePolicyNumber  || '',
      insuranceExpiryDate  : vi.insuranceExpiryDate ? new Date(vi.insuranceExpiryDate) : null,
      seatCapacity         : vi.seatCapacity           || '',
      driverName           : vi.driverName             || '',
      driverPhone          : vi.driverPhone            || '',
      driverAddress        : vi.driverAddress          || '',
    },
    //status    : 'active',
    // Date      : new Date().toLocaleDateString('en-GB').replace(/\//g, ''), // ddmmyyyy
    // logTimeMS : Date.now(),
  };

  const { acknowledged, insertedId } = await db.collection('organization_vehicle').insertOne(document);
  return res.status(200).json({ status: 'success', vehicleId: insertedId });
}


export const updateVehicle = async(req, res) =>{
//   const { postdata, userTracker } = req;
//   const form = postdata?.form;
   const vehicleData = req.body.data?.form;
   const { initiator, role} = req;

  await actionLog(vehicleData, initiator, role, 'updateVehicle');

  const { error, value } = updateVehicleSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const db      = getDb();
  const $set    = {};
  const vi      = value.vehicleInformation || {};

  if (value.status) $set.status = value.status;

  const viFields = [
    'name', 'regno', 'type', 'make', 'model', 'tabDeviceName',
    'ownerName', 'ownerPhone', 'ownerAddress', 'manufactureYear',
    'purchasedYear', 'color', 'fuel', 'engineNumber', 'chasisNumber',
    'insuranceCompany', 'insurancePolicyNumber', 'seatCapacity',
    'driverName', 'driverPhone', 'driverAddress',
  ];
  for (const field of viFields) {
    if (vi[field] !== undefined) $set[`vehicleInformation.${field}`] = vi[field];
  }
  if (vi.insuranceExpiryDate !== undefined) {
    $set['vehicleInformation.insuranceExpiryDate'] = vi.insuranceExpiryDate
      ? new Date(vi.insuranceExpiryDate)
      : null;
  }

  if (Object.keys($set).length === 0) {
    return res.json({ status: 'failure', response: ['No fields to update'] });
  }

  const result = await db.collection('organization_vehicle').updateOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId },
    { $set }
  );

  if (result.matchedCount === 0) return res.status(400).json({ status: 'failure', ec: 'failedupdate failed' });

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}


export const deleteVehicle = async(req, res) => {
//   const { postdata, userTracker } = req;
//   const form = postdata?.form;

//   await orgUsersActionLog(postdata, userTracker, 'admin', 'deleteVehicle');
const vehicleData = req.body.data?.form;
   const { initiator, role} = req;

  await actionLog(vehicleData, initiator, role, 'updateVehicle');

  const { error, value } = deleteVehicleSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', ec: 'SCB5' });
  }

  const db = getDb();

  const vehicleExists = await db.collection('organization_vehicle').countDocuments({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
    $or           : [{ status: 'active' }, { status: 'disabled' }],
  });
  if (vehicleExists === 0) return res.status(400).json({ status: 'failure', ec: 'SCB7' });

  await db.collection('organization_vehicle').updateOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId },
    { $set: { status: 'hold' } }
  );

  return res.status(400).json({ status: 'success', vehicleId: value.vehicleId });
}

export const removeVehicle = async(req, res) => {
  const { postdata, userTracker } = req;
  const form = postdata?.form;const vehicleData = req.body.data?.form;
   const { initiator, role} = req;

  await actionLog(vehicleData, initiator, role, 'updateVehicle');

  

  const { error, value } = deleteVehicleSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', ec: 'SCB5' });
  }

  const db = getDb();

  const vehicleExists = await db.collection('organization_vehicle').countDocuments({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
  });
  if (vehicleExists === 0) return res.json({ status: 'failure', ec: 'SCB7' });

  await db.collection('organization_vehicle').deleteOne({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
  });

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}


  const viewVehicles = async (req, res) =>{

    const vehicleData = req.body.data?.form;
    const filterBy = req.body.data?.filter || {};
    const extra    = req.body.data?.extra  || {};
    const { initiator, role} = req;

  await actionLog(vehicleData, initiator, role, 'viewVehicles');
//   const { postdata, userTracker } = req;
//   const filterBy = postdata?.filter || {};
//   const extra    = postdata?.extra  || {};



  //await orgUsersActionLog(postdata, userTracker, 'admin', 'viewVehicles');

  const { error } = viewVehiclesSchema.validate(filterBy, { abortEarly: false });
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
}