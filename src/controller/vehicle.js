import { ObjectId } from "mongodb";
import { createVehicleSchema, updateVehicleSchema, deleteVehicleSchema, viewVehiclesSchema  } from "../validator/trackerSchema.js";
import {actionLog, parseBool} from "../utils/helper.js";
import { getDb } from "../config/mongo.js";


export const createVehicle = async(req, res) => {
  const form = req.body.data?.form;
  const { initiator, role} = req;
  await actionLog(form, initiator, role, 'createVehicle');
  
  
  const { error, value } = createVehicleSchema.validate(form, { abortEarly: false });
  console.log('error'+ value);
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }
  //console.log('value: '+JSON.stringify({ organizationId: value.organizationId, status: 'active' }));
  const db = getDb();

  // Resolve organization
  const org = await db.collection('organization').findOne(
    { _id: new ObjectId(value.organizationId), status: 'active' },
    { projection: { name: 1 } }
  );
  if (!org) return res.status(400).json({ status: 'failure', message: 'organization not found' });


  const vehRegnoString  = value.regno;
  console.log(vehRegnoString);
  // Check vehicle uniqueness
  const vehicleExists = await db.collection('organization_vehicle').findOne({
    regno: vehRegnoString,
    organizationId: value.organizationId,
    status        : 'active',
  });
  if (vehicleExists) return res.status(400).json({ status: 'failure', message: 'already exists' });

 

  // const document = {
    
  //   organizationId      : value.organizationId,
  //    name                 : value.name,
  //     regno                : value.regno,
  //     type                 : value.type                  || '',
  //     make                 : value.make                  || '',
  //     model                : value.model                 || '',
  //     tabDevalueceName        : value.tabDevalueceName          || '',
  //     ownerName            : value.ownerName              || '',
  //     ownerPhone           : value.ownerPhone             || '',
  //     ownerAddress         : value.ownerAddress           || '',
  //     manufactureYear      : value.manufactureYear        || '',
  //     purchasedYear        : value.purchasedYear          || '',
  //     color                : value.color                  || '',
  //     fuel                 : value.fuel                   || '',
  //     engineNumber         : value.engineNumber           || '',
  //     chasisNumber         : value.chasisNumber           || '',
  //     insuranceCompany     : value.insuranceCompany       || '',
  //     insurancePolicyNumber: value.insurancePolicyNumber  || '',
  //     insuranceExpiryDate  : value.insuranceExpiryDate ? new Date(value.insuranceExpiryDate) : null,
  //     seatCapacity         : value.seatCapacity           || '',
  //     driverName           : value.driverName             || '',
  //     driverPhone          : value.driverPhone            || '',
  //     driverAddress        : value.driverAddress          || '',
    
  
  // };

  const { acknowledged, insertedId } = await db.collection('organization_vehicle').insertOne(value);
  return res.status(200).json({ status: 'success', vehicleId: insertedId });
}


export const updateVehicle = async(req, res) =>{

   const form = req.body.data?.form;
  const { initiator, role} = req;
  const filterBy = req.body.data?.filter;
  

  await actionLog(form, initiator, role, 'updateVehicle');

  const { error, value } = updateVehicleSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const db      = getDb();
  
  const result = await db.collection('organization_vehicle').updateOne(
    { _id : new ObjectId(filterBy.vehicleId), organizationId: filterBy.organizationId },
    { $set: value }
  );
  if (result.matchedCount === 0) return res.status(400).json({ status: 'failure', message: 'failed to update' });

  return res.json({ status: 'success', vehicleId: filterBy.vehicleId });
}


export const deleteVehicle = async(req, res) => {

const vehicleData = req.body.data?.form;
   const { initiator, role} = req;

  await actionLog(vehicleData, initiator, role, 'deleteVehicle');

  const { error, value } = deleteVehicleSchema.validate(vehicleData, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', ec: 'SCB5' });
  }

  const db = getDb();

  const vehicleExists = await db.collection('organization_vehicle').countDocuments({
    _id     : new ObjectId(value.vehicleId),
    organizationId: value.organizationId,
    $or           : [{ status: 'active' }, { status: 'inactive' }],
  });
  if (vehicleExists === 0) return res.status(400).json({ status: 'failure', message: 'vehicle not found' });

  await db.collection('organization_vehicle').updateOne(
    { _id: new ObjectId(value.vehicleId), organizationId: value.organizationId },
    { $set: { status: 'hold' } }
  );

  return res.status(200).json({ status: 'success', vehicleId: value.vehicleId });
}

export const removeVehicle = async(req, res) => {
 const vehicleData = req.body.data?.form;
   const { initiator, role} = req;

    await actionLog(vehicleData, initiator, role, 'removeVehicle');

  const { error, value } = deleteVehicleSchema.validate(vehicleData, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', ec: 'SCB5' });
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
}


  export const viewVehicles = async (req, res) =>{
    console.log(`test: ${JSON.stringify(req.body)}`);
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
}