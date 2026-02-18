import { ObjectId } from "mongodb";
import {  } from "../validator/imeiSchema.js";
import {actionLog, parseBool} from "../utils/helper.js";
import { getDb } from "../config/mongo.js";
import {assignImeiSchema, unassignImeiSchema, viewImeiSchema} from "../validator/imeiSchema.js"


const checkImeiUniqueness = (db, { imei, imei2 }, excludeVehicleId = null) => {
  const candidates = [imei, imei2].filter(Boolean);
  if (candidates.length === 0) return null;

  const orClauses = candidates.flatMap(v => [{ imei: v }, { imei2: v }]);
  const query     = { $or: orClauses, status: 'active' };
  if (excludeVehicleId) query.vehicleId = { $ne: excludeVehicleId };

  return db.collection('organization_imei').findOne(query);
}


export const  assignImei = async(req, res) => {
  // const { postdata, userTracker } = req;
  // const form = postdata?.form;
  const imeaData = req.body.data?.form;
    const { initiator, role} = req;

  await actionLog(imeaData, initiator, role, 'assignImei');

  const { error, value } = assignImeiSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const db = getDb();

  // Vehicle must exist
  const vehicle = await db.collection('organization_vehicle').findOne({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
    status        : 'active',
  });
  if (!vehicle) return res.status(400).json({ status: 'failure', message: 'vahicle not found' });

  // Device must not already be assigned to this vehicle
  const alreadyAssigned = await db.collection('organization_imei').findOne({
    vehicleId: value.vehicleId,
    status   : 'active',
  });
  if (alreadyAssigned) return res.json({ status: 'failure', ec: 'already assigned' }); // already has device

  // IMEI global uniqueness check
  const duplicate = await checkImeiUniqueness(db, value);
  if (duplicate) return res.status(400).json({ status: 'failure', ec: 'duplicate found' });

  const document = {
    deviceId      : String(Date.now()),          // surrogate key
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
    imei          : value.imei     || '',
    imei2         : value.imei2    || '',
    boxid         : value.boxid,
    boxid2        : value.boxid2   || '',
    simCard       : value.simCard  || '',
    simCard2      : value.simCard2 || '',
    simvendor     : value.simvendor  || '',
    simvendor2    : value.simvendor2 || '',
    status        : 'active',
    // Date          : new Date().toLocaleDateString('en-GB').replace(/\//g, ''),
    // logTimeMS     : Date.now(),
  };

  await db.collection('organization_imei').insertOne(document);
  return res.json({ status: 'success', deviceId: document.deviceId });
}


export const  updateImei = async(req, res) =>{
  // const { postdata, userTracker } = req;
  // const form = postdata?.form;
  const imeaData = req.body.data?.form;
    const { initiator, role} = req;

  await actionLog(imeaData, initiator, 'admin', role, 'updateImei');

  const { error, value } = updateImeiSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const db = getDb();

  // IMEI uniqueness – exclude the current vehicle's own record
  const duplicate = await checkImeiUniqueness(db, value, value.vehicleId);
  if (duplicate) return res.json({ status: 'failure', ec: 'SCB9' });

  // Fetch old record for history
  const oldDevice = await db.collection('organization_imei').findOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId, status: 'active' },
    { projection: { imei: 1, imei2: 1, boxid: 1, boxid2: 1, simCard: 1, simCard2: 1 } }
  );
  if (!oldDevice) return res.json({ status: 'failure', ec: 'SCB7' });

  const $set = {};
  const fields = ['imei', 'imei2', 'boxid', 'boxid2', 'simCard', 'simCard2', 'simvendor', 'simvendor2'];
  for (const f of fields) {
    if (value[f] !== undefined) $set[f] = value[f];
  }

  if (Object.keys($set).length === 0) {
    return res.json({ status: 'failure', response: ['No fields to update'] });
  }

  await db.collection('organization_imei').updateOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId, status: 'active' },
    { $set }
  );

  const imeiChanged = (value.imei  && oldDevice.imei  !== value.imei)
                   || (value.imei2 && oldDevice.imei2 !== value.imei2);
  const boxChanged  = (value.boxid  && oldDevice.boxid  !== value.boxid)
                   || (value.boxid2 && oldDevice.boxid2 !== value.boxid2);

  if (imeiChanged || boxChanged) {
    const orgInfo = await db.collection('organization').findOne(
      { tracker: value.organizationId, status: 'active' },
      { projection: { name: 1 } }
    );

    const histDoc = {
      tracker     : String(Date.now()),
      vehicleId   : value.vehicleId,
      organizationId: value.organizationId,
      orgName     : orgInfo?.name || '',
      userTracker,
      logTimeMS   : Date.now(),
      old_imei    : oldDevice.imei,
      old_imei2   : oldDevice.imei2,
      old_boxid   : oldDevice.boxid,
      old_boxid2  : oldDevice.boxid2,
      old_simCard : oldDevice.simCard,
      old_simCard2: oldDevice.simCard2,
      ...(value.imei   && { new_imei   : value.imei }),
      ...(value.imei2  && { new_imei2  : value.imei2 }),
      ...(value.boxid  && { new_boxid  : value.boxid }),
      ...(value.boxid2 && { new_boxid2 : value.boxid2 }),
    };

    await db.collection('imei_history').insertOne(histDoc);
  }

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}

export const unassignImei = async(req, res) => {
  const imeaData = req.body.data?.form;
    const { initiator, role} = req;


  await actionLog(postdata, userTracker, 'admin', 'unassignImei');

  const { error, value } = unassignImeiSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', ec: 'SCB5' });
  }

  const db = getDb();

  const deviceExists = await db.collection('organization_imei').countDocuments({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
    $or           : [{ status: 'active' }, { status: 'disabled' }],
  });
  if (deviceExists === 0) return res.json({ status: 'failure', ec: 'SCB7' });

  await db.collection('organization_imei').updateOne(
    { vehicleId: value.vehicleId, organizationId: value.organizationId },
    { $set: { status: 'hold' } }
  );

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}


export const removeImei = async(req, res) => {
  const { postdata, userTracker } = req;
  const form = postdata?.form;

  await orgUsersActionLog(postdata, userTracker, 'admin', 'removeImei');

  const { error, value } = unassignImeiSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', ec: 'SCB5' });
  }

  const db = mongoose.connection;

  const deviceExists = await db.collection('organization_imei').countDocuments({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
  });
  if (deviceExists === 0) return res.json({ status: 'failure', ec: 'SCB7' });

  await db.collection('organization_imei').deleteOne({
    vehicleId     : value.vehicleId,
    organizationId: value.organizationId,
  });

  return res.json({ status: 'success', vehicleId: value.vehicleId });
}

export const viewImei = async(req, res) => {
  const { postdata, userTracker } = req;
  const filterBy = postdata?.filter || {};
  const extra    = postdata?.extra  || {};

  await orgUsersActionLog(postdata, userTracker, 'admin', 'viewImei');

  const { error } = viewImeiSchema.validate(filterBy, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
  }

  const limit     = 25;
  const pageIndex = extra.pageIndex > 0 ? extra.pageIndex : 0;
  const pageJump  = extra.pageJump ? extra.pageJump * limit : pageIndex;
  const skip      = pageJump > 0 ? pageJump : pageIndex;
  const sort      = extra.orderByDateCreated === '-1' ? { logTimeMS: -1 } : {};

  const db          = mongoose.connection;
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






// export const addImei = async (req, res) => {
//   try {
//     const imeiData = req.body.data.form?.imeiInformation;
//     if (!imeiData) {
//       return res.status(400).json({ status: "failure", message: "Missing input" });
//     }
//     const { error, value } = addImeaSchema.validate(imeiData, { abortEarly: false });
//     if (error) {
//        validationErrors = error.details.map(detail => detail.message);
//        return res.status(400).json({ status: "failure", message: validationErrors });
//     }
    
//     // let searchQuery = {};
//     // if (imeiData.imei) {
//     //   searchQuery.$or = [
//     //     { imei: imeiData.imei },
//     //     { imei2: imeiData.imei }
//     //   ];
//     // }
//     // if (imeiData.imei2) {
//     //   searchQuery.$or = [
//     //     { imei: imeiData.imei2 },
//     //     { imei2: imeiData.imei2 }
//     //   ];
//     // }
//     let orArray = [];
//     if(imeiData.imei) {
//         orArray.push({ imei: imeiData.imei });
//         orArray.push({ imei2: imeiData.imei });
//        }
//     if(imeiData.imei2) {
//         orArray.push({ imei: imeiData.imei2 });
//         orArray.push({ imei2: imeiData.imei2 });
//       }
//     const db = getDb();
//     const imeiColl = db.collection("organization_imeis");
    
//     const  imei = await imeiColl.findOne({ $or: orArray });
//     console.log({$or: orArray });
//     if (imei) {
//       return res.status(400).json({ status: "failure", message: "imei already exist" });
//     } 
//     const { acknowledged, insertedId } = await imeiColl.insertOne(value);
//     if(acknowledged){
//       return res.status(200).json({ status: "success", message: insertedId });
//     }
//     return res.status(400).json({ status: "failure", message: "failed to insert the imei record" });

//   } catch (error) {
//     console.error(`Error on addImei: ${error}`);
//     return res.status(500).json({ status: "failure", message: "Internal server error" });
//   }
// }

// export const updateImei = async (req, res) => {
//   try {
//     const imeiData = req.body.data.form?.imeiInformation;
//     if (!imeiData) {
//       return res.status(400).json({ status: "failure", message: "Missing input" });
//     }
//     const { error, value } = updateImeaSchema.validate(imeiData, { abortEarly: false });
//     if (error) {
//        validationErrors = error.details.map(detail => detail.message);
//        return res.status(400).json({ status: "failure", message: validationErrors });
//     }
    
//      let orArray = [];
//     if(imeiData.imei) {
//         orArray.push({ imei: imeiData.imei });
//         orArray.push({ imei2: imeiData.imei });
//        }
//     if(imeiData.imei2) {
//         orArray.push({ imei: imeiData.imei2 });
//         orArray.push({ imei2: imeiData.imei2 });
//       }
//       orArray.push({status: 'active'})
   
//     const db = getDb();
//     const imeiColl = db.collection("organization_imeis");
//     const  imei = await imeiColl.findOne({$or: orArray });
//     const orgId = imeiData.organizationId
//     if (imei) {
//        return res.status(400).json({ status: "failure", message: "active imei can not be updated"});
//     }
    




//     const result = await imeiColl.updateOne({organizationId: orgId}, {$set: value});
//     if(result.acknowledged){
//       return res.status(200).json({ status: "success", message: "Imei updated successfully" });
//     }
//      return res.status(400).json({ status: "failure", message: "failed to update the record" });

//   } catch (error) {
//     console.error(`Error on updateImei: ${error}`);
//     return res.status(500).json({ status: "failure", message: "Internal server error" });
//   }
// };

// export const addVehicle = async (req, res) => {
//   try {
//     const vehicleData = req.body.data.form?.vehicleInformation;
//     if (!vehicleData) {
//       return res.status(400).json({ status: "failure", message: "Missing input" });
//     }
//     const { error, value } = addVehicleSchema.validate(vehicleData, { abortEarly: false });
//     if (error) {
//        validationErrors = error.details.map(detail => detail.message);
//        return res.status(400).json({ status: "failure", message: validationErrors });
//     }
    
//     const db = getDb();
//     const vehicleColl = db.collection("organization_vehicles");
   
//     const { acknowledged, insertedId } = await vehicleColl.insertOne(value);
//     if(acknowledged){
//       return res.status(200).json({ status: "success", message: insertedId });
//     }
//     return res.status(400).json({ status: "failure", message: "failed to insert the vehicle record" });

//   } catch (error) {
//     console.error(`Error on addVehicle: ${error}`);
//     return res.status(500).json({ status: "failure", message: "Internal server error" });
//   }
// }

// export const updateVehicle = async (req, res) => {
//   try {
//     const vehicleData = req.body.data.form?.vehicleInformation;
//     if (!vehicleData) {
//       return res.status(400).json({ status: "failure", message: "Missing input" });
//     }
//     const { error, value } = updateVehicleSchema.validate(imeiData, { abortEarly: false });
//     if (error) {
//        validationErrors = error.details.map(detail => detail.message);
//        return res.status(400).json({ status: "failure", message: validationErrors });
//     }
    
    
//     searchQuery.status = 'active';
//     const db = getDb();
//     const vehicleColl = db.collection("organization_vehicles");
//     const  vehicle = await vehicleColl.findOne(searchQuery);
//     const orgId = vehicleColl.organizationId
//     if (imei) {
//        return res.status(400).json({ status: "failure", message: "active imei can not be updated"});
//     }
//     const result = await imeiColl.updateOne({organizationId: orgId}, {$set: value});
//     if(result.acknowledged){
//       return res.status(200).json({ status: "success", message: "Imei updated successfully" });
//     }
//      return res.status(400).json({ status: "failure", message: "failed to update the record" });

//   } catch (error) {
//     console.error(`Error on updateImei: ${error}`);
//     return res.status(500).json({ status: "failure", message: "Internal server error" });
//   }
// };


