import { ObjectId } from "mongodb";
import { createOrgSchema, updateOrgSchema, viewOrgFilterSchema, deleteOrgSchema } from "../validator/orgSchema.js";
import {actionLog, parseBool} from "../utils/helper.js";
import { getDb } from "../config/mongo.js";

export const createOrganization = async (req, res) => {
  try {
    const orgData             = req.body?.data?.form;
    const { initiator, role } = req;

    if (!orgData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    
    const { error, value } = createOrgSchema.validate(orgData, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "failure",
        message: error.details.map(d => d.message),
      });
    }

    await actionLog(orgData, initiator, role, "createOrganization");


    const db = getDb();
    const orgColl = db.collection("organization");
    const exists  = await orgColl.findOne({ name: value.name, status: "active" });

    if (exists) {
      return res.status(409).json({ status: "failure", message: "Organization already exists" });
    }
    
    const { acknowledged, insertedId } = await orgColl.insertOne(value);
    if (!acknowledged) {
      return res.status(500).json({ status: "failure", message: "Failed to insert the record" });
    }

    return res.status(201).json({ status: "success", organizationId: insertedId });
  } catch (error) {
    console.error(`[createOrganization] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};


export const editOrganization = async (req, res) => {
  try {
    const orgData             = req.body?.data?.form;
    const orgId               = req.body?.data?.filter?.organizationId;
    const { initiator, role } = req;

    if (!orgData || !orgId) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }

    const { error, value } = updateOrgSchema.validate(orgData, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "failure",
        message: error.details.map(d => d.message),
      });
    }

    await actionLog(orgData, initiator, role, "editOrganization");

    const db = getDb();
    const { matchedCount } = await db
      .collection("organization")
      .updateOne({ _id: new ObjectId(orgId) }, { $set: value });

    if (matchedCount === 0) {
      return res.status(404).json({ status: "failure", message: "Organization not found" });
    }

    return res.status(200).json({ status: "success", organizationId: orgId });
  } catch (error) {
    console.error(`[editOrganization] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};


export const viewOrganization = async (req, res) => {
 
  try {
    const extra               = req.body?.data?.extra  || {};
    const filterBy            = req.body?.data?.filter || {};
    const { initiator, role } = req;

    await actionLog(filterBy, initiator, role, "viewOrganization");

  const { error } = viewOrgFilterSchema.validate(filterBy, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: "failure",
        message: error.details.map(d => d.message),
      });
    }
  
  const limit     = 10;
  const pageIndex = extra.pageIndex > 0 ? extra.pageIndex : 0;
  const pageJump  = extra.pageJump  ? extra.pageJump * limit : pageIndex;
  const skip      = pageJump > 0 ? pageJump : pageIndex;

  const db  = getDb();
  const searchQuery = { status: 'active' };

  // Optional tracker lookup by device fields
  // let orgFromDevice = null;
  // if (filterBy.regNo || filterBy.boxId || filterBy.imei || filterBy.simCard) {
  //   const trackerQuery = {};
  //   if (filterBy.regNo)   trackerQuery['vehicleInformation.regno'] = new RegExp(filterBy.regNo, 'i');
  //   if (filterBy.boxId)   trackerQuery.boxid  = filterBy.boxId;
  //   if (filterBy.imei)    trackerQuery.$or    = [{ imei: filterBy.imei }, { imei2: filterBy.imei }];
  //   if (filterBy.simCard) trackerQuery.simCard = filterBy.simCard;
  //   trackerQuery.status = 'active';
  //   const tDoc = await db.collection('organization_tracker').findOne(trackerQuery, { projection: { organizationTracker: 1 } });
  //   if (tDoc?.organizationTracker) orgFromDevice = tDoc.organizationTracker;
  // }

  // if (orgFromDevice || filterBy.organizationId) {
  //   searchQuery.tracker = orgFromDevice || filterBy.organizationId;
  // }
  if(filterBy.organizationId) {
    searchQuery.tracker = filterBy.organizationId;
  }
  if (filterBy.name)     searchQuery.name     = new RegExp(filterBy.name, 'i');
  if (filterBy.category) searchQuery.category = new RegExp(filterBy.category, 'i');
  if (filterBy.city)     searchQuery.city     = new RegExp(filterBy.city, 'i');
  if (filterBy.state)    searchQuery.state    = new RegExp(filterBy.state, 'i');
  if (filterBy.country)  searchQuery.country  = new RegExp(filterBy.country, 'i');
  if (filterBy.email)    searchQuery.email    = new RegExp(filterBy.email, 'i');

  if (filterBy.location) {
    searchQuery.$or = [
      { area:  new RegExp(filterBy.location, 'i') },
      { city:  new RegExp(filterBy.location, 'i') },
      { state: new RegExp(filterBy.location, 'i') },
    ];
  }

  ['smsAlert', 'appAlert', 'emailAlert', 'callAlert', 'rfidAlert', 'etaAlert', 'alertlock'].forEach(flag => {
    const b = parseBool(filterBy[flag]);
    if (b !== undefined) searchQuery[flag] = b;
  });

  const sort = extra.orderByDateCreated === '-1' ? { _id: -1 } : {};
 
  const docs = await db.collection('organization')
    .find(searchQuery)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();
   const organizations = await Promise.all(docs.map(async item => {
    
    item.organizationId = item._id;
    delete item._id;
    // delete item.tracker;
    // delete item.cashedDATEobjInsert;
    // delete item.cashedDATEobjUpdate;

    // const lastLogin = await db.collection('loginlatest').findOne(
    //   { orgId: item.organizationId },
    //   { projection: { userName: 1, routeId: 1, userEmail: 1, loginTime: 1 } }
    // );
    // if (lastLogin) { delete lastLogin._id; item.lastLogin = lastLogin; }

    const trackerCnt = await db.collection('organization_tracker').countDocuments({ organizationId: item.organizationId, status: 'active' });
    const userCnt    = await db.collection('organization_users').countDocuments({ organizationId: item.organizationId, status: 'active' });
    item.orgTrackerCount = trackerCnt;
    item.orgUserCount    = userCnt;

    return item;
  }));

  return res.status(200).json({ status: 'success', response: organizations });
   }catch(error){
   console.error(`Error on view organization: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
}

export const deleteOrganization = async (req, res) => {
   try {
    const form                = req.body?.data?.form;
    const organizationId      = form?.organizationId;
    const { initiator, role } = req;
  await actionLog(form, initiator, role, "deleteOrganization");

  const { error, value } = deleteOrgSchema.validate(form, { abortEarly: false });
    if (error) {
      return res.status(400).json({ status: "failure", message: "Parameter missing" });
    }


  const db  = getDb();
  const org = await db.collection('organization').findOne({ _id: new ObjectId(organizationId), status: 'active' });
  if (!org) {
    return res.status(404).json({ status: 'failure', message: 'organization not found' });
  }

  // Soft-delete org
  console.log(JSON.stringify({ _id: new ObjectId(organizationId)}, { $set: { status: 'hold' }}))
  await db.collection('organization').updateOne({ _id: new ObjectId(organizationId)}, { $set: { status: 'hold' }});
  // Cascade to users, trackers, routes, pickup, members, templates
  const cascade = { organizationId: value.organizationId, status: 'active' };
  await db.collection('organization_users').updateMany(cascade, { $set: { status: 'hold' } });
  //await db.collection('organization_tracker').updateMany(cascade, { $set: { status: 'hold' } });

  const orgCascade = { organizationId: value.organizationId, status: 'active' };
  // await db.collection('routes').updateMany(orgCascade, { $set: { status: 'hold' } });
  // await db.collection('pickupcollection').updateMany(orgCascade, { $set: { status: 'hold' } });
  // await db.collection('membercollection').updateMany(orgCascade, { $set: { status: 'hold' } });
  // await db.collection('templatecollection').updateMany(orgCascade, { $set: { status: 'hold' } });
  // await db.collection('assignmentcollection').deleteMany({ orgId: value.organizationId });

  // Action log
  await db.collection('actionLog').insertOne({ action: 'delete', collection: 'organizations', user: initiator });

  return res.status(200).json({ status: 'success' });
}catch (error) {
    console.error(`[deleteOrganization] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }

}


export const adminDashBoardCount = async (req, res) => {
  try {
    const { initiator, role } = req;
    await actionLog("adminDashBoardCount", initiator, role, "adminDashBoardCount");

    const db    = getDb();
    const query = { status: "active" };

    const [
      activeOrgCount,
      activeTrackerCount,
      activeAdminUC,
      activeOrgAdminUC,
    ] = await Promise.all([
      db.collection("organization").countDocuments(query),
      db.collection("organization_tracker").countDocuments(query),
      db.collection("admin_users").countDocuments(query),
      db.collection("organization_users").countDocuments(query),
    ]);

    return res.status(200).json({
      status: "success",
      response: {
        AdminStats: { activeOrgCount, activeTrackerCount, activeAdminUC, activeOrgAdminUC },
      },
    });
  } catch (error) {
    console.error(`[adminDashBoardCount] ${error.message}`, { stack: error.stack });
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};