import { createOrgSchema, updateOrgSchema } from "../validator/orgSchema.js";
import actionLog from "../utils/helper.js";

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
      return res.status(200).json({ status: "success", message: insertedId });
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

    await orgUsersActionLog(orgData, initiator, role, 'editOrganization');

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