import { ObjectId } from "mongodb";
import { actionLog } from "../utils/helper.js";
import { getDb } from "../config/mongo.js";
import {assignImeiSchema, updateImeiSchema, unassignImeiSchema, viewImeiSchema} from "../validator/imeiSchema.js"


const checkImeiUniqueness = (db, { imei, imei2 }, excludeVehicleId = null) => {
  const candidates = [imei, imei2].filter(Boolean);
  if (candidates.length === 0) return Promise.resolve(null);

  const orClauses = candidates.flatMap(v => [{ imei: v }, { imei2: v }]);
  const query     = { $or: orClauses, status: "active" };
  if (excludeVehicleId) query.vehicleId = { $ne: excludeVehicleId };

  return db.collection("organization_imei").findOne(query);
};


export const assignImei = async (req, res) => {
  try {
    const imeiData            = req.body?.data?.form;
    const { initiator, role } = req;

    await actionLog(imeiData, initiator, role, "assignImei");

    const { error, value } = assignImeiSchema.validate(imeiData, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "failure",
        message: error.details.map(d => d.message),
      });
    }

  const db = getDb();

  // Vehicle must exist
  const vehicle = await db.collection('organization_vehicle').findOne({
    _id     : new ObjectId(value.vehicleId),
    organizationId: value.organizationId,
    status        : 'active',
  });
  if (!vehicle) return res.status(400).json({ status: 'failure', message: 'vehicle not found' });

  // Device must not already be assigned to this vehicle
  const alreadyAssigned = await db.collection('organization_imei').findOne({
    vehicleId: value.vehicleId,
    status   : 'active',
  });
  if (alreadyAssigned) return res.json({ status: 'failure', ec: 'already assigned' }); // already has device

  // IMEI global uniqueness check
  const duplicate = await checkImeiUniqueness(db, value);
  if (duplicate) return res.status(409).json({ status: "failure", message: "IMEI already in use" });

  const { acknowledged, insertedId } = await db.collection("organization_imei").insertOne(value);
    if (!acknowledged) {
      return res.status(500).json({ status: "failure", message: "Failed to insert the record" });
    }

    return res.status(201).json({ status: "success", deviceId: insertedId });
  }catch (error) {
    console.error(`[assignImei] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
}


export const  updateImei = async(req, res) =>{
  
  const imeaData = req.body.data?.form;
    const { initiator, role} = req;

  await actionLog(imeaData, initiator, role, 'updateImei');

  const { error, value } = updateImeiSchema.validate(imeaData, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const db = getDb();

  // IMEI uniqueness – exclude the current vehicle's own record
  const duplicate = await checkImeiUniqueness(db, value, value.vehicleId);
  if (duplicate) return res.json({ status: 'failure', message: 'duplicate record found' });

  // Fetch old record for history
  const oldDevice = await db.collection('organization_imei').findOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId, status: 'active' },
    { projection: { imei: 1, imei2: 1, boxid: 1, boxid2: 1, simCard: 1, simCard2: 1 } }
  );
  if (!oldDevice) return res.json({ status: 'failure', message: 'device not found' });

  // const $set = {};
  // const fields = ['imei', 'imei2', 'boxid', 'boxid2', 'simCard', 'simCard2', 'simvendor', 'simvendor2'];
  // for (const f of fields) {
  //   if (value[f] !== undefined) $set[f] = value[f];
  // }

  // if (Object.keys($set).length === 0) {
  //   return res.json({ status: 'failure', response: ['No fields to update'] });
  // }

  await db.collection('organization_imei').updateOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId, status: 'active' },
    { $set: value }
  );

  // const imeiChanged = (value.imei  && oldDevice.imei  !== value.imei)
  //                  || (value.imei2 && oldDevice.imei2 !== value.imei2);
  // const boxChanged  = (value.boxid  && oldDevice.boxid  !== value.boxid)
  //                  || (value.boxid2 && oldDevice.boxid2 !== value.boxid2);

  // if (imeiChanged || boxChanged) {
  //   const orgInfo = await db.collection('organization').findOne(
  //     { tracker: value.organizationId, status: 'active' },
  //     { projection: { name: 1 } }
  //   );

  //   const histDoc = {
  //     tracker     : String(Date.now()),
  //     vehicleId   : value.vehicleId,
  //     organizationId: value.organizationId,
  //     orgName     : orgInfo?.name || '',
  //     userTracker,
  //     logTimeMS   : Date.now(),
  //     old_imei    : oldDevice.imei,
  //     old_imei2   : oldDevice.imei2,
  //     old_boxid   : oldDevice.boxid,
  //     old_boxid2  : oldDevice.boxid2,
  //     old_simCard : oldDevice.simCard,
  //     old_simCard2: oldDevice.simCard2,
  //     ...(value.imei   && { new_imei   : value.imei }),
  //     ...(value.imei2  && { new_imei2  : value.imei2 }),
  //     ...(value.boxid  && { new_boxid  : value.boxid }),
  //     ...(value.boxid2 && { new_boxid2 : value.boxid2 }),
  //   };

    await db.collection('imei_history').insertOne(value);
  

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}

export const unassignImei = async(req, res) => {
  try {
    const imeiData            = req.body?.data?.form;
    const { initiator, role } = req;

    await actionLog(imeiData, initiator, role, "updateImei");

    const { error, value } = updateImeiSchema.validate(imeiData, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "failure",
        message: error.details.map(d => d.message),
      });
    }

  const db = getDb();

  const deviceExists = await db.collection('organization_imei').countDocuments({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
    $or           : [{ status: 'active' }, { status: 'disabled' }],
  });
  if (deviceExists === 0) return res.json({ status: 'failure', message: 'SCB7' });

  await db.collection('organization_imei').updateOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId },
    { $set: { status: 'hold' } }
  );

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}catch (error) {
    console.error(`[updateImei] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
}


export const removeImei = async(req, res) => {
  const imeaData = req.body.data?.form;
    const { initiator, role} = req;

  await actionLog(imeaData, initiator, role, 'removeImei');

  const { error, value } = unassignImeiSchema.validate(imeaData, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', ec: 'SCB5' });
  }

  const db = getDb();

  const deviceExists = await db.collection('organization_imei').countDocuments({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
  });
  if (deviceExists === 0) return res.status(400).json({ status: 'failure', message: 'imei not found' });

  await db.collection('organization_imei').deleteOne({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
  });

  return res.status(200).json({ status: 'success', vehicleId: value.vehicleId });
}

export const viewImei = async(req, res) => {
  // const { postdata, userTracker } = req;
  // const filterBy = postdata?.filter || {};
  // const extra    = postdata?.extra  || {};
   const imeaData = req.body.data?.form;
  const extra = req.body.data?.extra;
  const filterBy = req.body.data?.filter
  const { initiator, role} = req;

  await actionLog(imeaData, initiator, role, 'viewImei');

  const { error } = viewImeiSchema.validate(filterBy, { abortEarly: false });
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
  if (filterBy.imei)      searchQuery.$or = [{ imei: filterBy.imei }, { imei2: filterBy.imei }];
  searchQuery.status = filterBy.status || 'active';

  const docs = await db.collection('organization_imei')
    .find(searchQuery, { projection: { _id: 0 } })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();

  return res.json({ status: 'success', response: docs });
}






