import { ObjectId } from "mongodb";
import { createOrgSchema, updateOrgSchema, viewOrgFilterSchema, deleteOrgSchema } from "../validator/orgSchema.js";
import {actionLog, parseBool} from "../utils/helper.js";
import { getDb } from "../config/mongo.js";

export const createOrganization = async (req, res) => {
  try {
    const orgData = req.body.data?.form;
    const { initiator, role} = req;
    if (!orgData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    
    const { error, value } = createOrgSchema.validate(orgData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: "failure", message: validationErrors });
    }

    await actionLog(orgData, initiator, role, 'createOrganization');


    const db = getDb();
    const orgColl = db.collection("organization");
    const searchQuery = { name: orgData.name, status: "active" };
    
    const org = await orgColl.findOne(searchQuery);
    if (org) {
      return res.status(400).json({ status: "failure", message: "organization already exist" });
    }
    
    const { acknowledged, insertedId } = await orgColl.insertOne(value);
    if(acknowledged){
      return res.status(200).json({ status: "success", organizationId: insertedId });
    }
    return res.status(400).json({ status: "failure", message: "failed to insert the record" });

  } catch (error) {
    console.error(`Error on createOrganization: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};


export const editOrganization = async (req, res) => {
  try {
    const orgData = req.body.data?.form;
    const orgId = req.body.data.filter?.organizationId;
    const { initiator, role} = req;

    if (!orgData || !orgId) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }

    const { error, value } = updateOrgSchema.validate(orgData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: "failure", message: validationErrors });
    }

    await actionLog(orgData, initiator, role, 'editOrganization');
    

    const db = getDb();
    const orgColl = db.collection("organization");
    
    const {acknowledged} = await orgColl.updateOne({_id: new ObjectId(orgId)}, {$set: value});

    if(acknowledged){
      return res.status(200).json({ status: "success", message: orgId });
    }
     return res.status(400).json({ status: "failure", message: "failed to update the record" });

  } catch (error) {
    console.error(`Error on updateOrganization: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};


export const viewOrganization = async (req, res) => {
 
  try {
    const extra = req.body.data?.extra;
    const filterBy = req.body.data?.filter;
    const { initiator, role} = req;

  await actionLog(filterBy, initiator, role, 'viewOrganization');

  const { error } = viewOrgFilterSchema.validate(filterBy, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', response: error.details.map(d => d.message) });
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

  return res.json({ status: 'success', response: organizations });
   }catch(error){
   console.error(`Error on view organization: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
}

export const deleteOrganization = async (req, res) => {
  const form = req.body.data?.form;
  const organizationId = req.body.data?.organizationId;
  const { initiator, role} = req;
  await actionLog(form, initiator, role, 'deleteOrganization');

  const { error, value } = deleteOrgSchema.validate(form, { abortEarly: false });
  if (error) {
    return res.json({ status: 'failure', message: 'parameter missing' });
  }

  const db  = getDb();
  const org = await db.collection('organization').findOne({ tracker: organizationId, status: 'active' });
  if (!org) {
    return res.json({ status: 'failure', message: 'failed to delete' });
  }

  // Soft-delete org
  await db.collection('organization').updateOne({ tracker: value.organizationId }, { $set: { status: 'hold' } });
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

  return res.json({ status: 'success' });
}


export const adminDashBoardCount = async (req, res) => {
  try {
    const { initiator, role} = req;
   await actionLog('form', initiator, role, 'adminDashBoardCount');

     const query = { status: "active" };
    const db = getDb();

    const [
      ActiveOrgCount,
      ActiveTrackerCount,
      activeAdminUC,
      ActiveOrgAdminUC,
    ] = await Promise.all([
      db.collection("organization").countDocuments(query),
      db.collection("organization_tracker").countDocuments(query),
      db.collection("admin_users").countDocuments(query),
      db.collection("organization_users").countDocuments(query),
    ]);
     const TotalOrgRPMcount = {
      AdminStats: {
        activeOrgCount: ActiveOrgCount,
        activeTrackerCount: ActiveTrackerCount,
        activeAdminUC: activeAdminUC,
        activeOrgAdminUC: ActiveOrgAdminUC,
      },
    };
    return res.status(200).json({status: "success", response: TotalOrgRPMcount});
  } catch (err) {
    console.error("Internal Error:", err);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};