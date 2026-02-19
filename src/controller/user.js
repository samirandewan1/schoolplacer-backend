import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import actionLog from "../utils/helper.js";
import { getDb } from "../config/mongo.js";
import { encrypt } from "../utils/crypto.js";
import {  createUserSchema, updateUserSchema, resetUserSchema } from "../validator/orgUserSchema.js";



export const createUser = async (req, res) => {
  try {
    const userData = req.body.data?.form;
     const { initiator, role} = req;
    const { error, value } = createUserSchema.validate(userData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: "failure", message: validationErrors });
    }
    await actionLog(userData, initiator, role, 'createUser');
    const db = getDb();
    const userColl = db.collection("organization_users");
    const userExists = await db.collection('organization_users').countDocuments({
      loginName: value.loginname,
      organizationId: value.organizationId,
      status: 'active',
    });
    if (userExists > 0) return res.status(400).json({ status: 'failure', message: 'user already exists' });
    // Check duplicate email
     const emailExists = await db.collection('organization_users').countDocuments({
      email: value.email,
      status: 'active',
     });
     if (emailExists > 0) return res.status(400).json({ status: 'failure', message: 'user with same email already exists' });

    const securePassword = encrypt(value.password);
    const { acknowledged, insertedId } = await userColl.insertOne({...value, password: securePassword});
    if(acknowledged){
      return res.status(200).json({ status: "success", userId: insertedId });
    }
    return res.status(400).json({ status: "failure", message: "failed to insert the record" });

  } catch (error) {
    console.error(`Error on createOrganization: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userData = req.body.data?.form;
    const loginname = userData.loginname;
    const orgId = req.body.data.filter?.organizationId;
    const userId = req.body.data.filter?.userId;
    const { initiator, role} = req;
   
    if (!userData || !orgId || !loginname) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const db = getDb();
    const userColl = db.collection("organization_users");
    const { error, value } = updateUserSchema.validate(userData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: "failure", message: validationErrors });
    }
     await actionLog(userData, initiator, role, 'updateUser');

    // const searchQuery = { loginname: loginname, status: "active", organizationId: orgId, _id: { $ne: new ObjectId(userId) } };
    // const exists = await userColl.findOne(searchQuery);
    // if (exists) {
    //    return res.status(400).json({ status: "failure", message: "user already exist."});
    // }
     if (value.loginname) {
        //document.loginName = value.loginname;
        const loginExists = await db.collection('organization_users').countDocuments({
        loginname: value.loginname,
        organizationId: orgId,
        status: 'active',
        });
        if (loginExists > 0) {
          const existing = await db.collection('organization_users').findOne({ _id: new ObjectId(userId) });
          if (existing?.loginName !== value.loginname) {
            return res.json({ status: 'failure', message: 'user already exist' });
          }
        }
      }
      if(value.password){
       const securePassword = encrypt(value.password);
       value.password = securePassword;
      }
      const result = await userColl.updateOne({_id: new ObjectId(userId), organizationId: orgId}, {$set: value});
      
      if(result.acknowledged){
        return res.status(200).json({ status: "success", message: "user updated successfully" });
      }
      return res.status(400).json({ status: "failure", message: "failed to update the record" });

    } catch (error) {
      console.error(`Error on updateOrganization: ${error}`);
      return res.status(500).json({ status: "failure", message: "Internal server error" });
    }
  };


export const viewUsers = async (req, res) => {
 
  try {
    const extra = req.body.data?.extra;
    const filterBy = req.body.data?.filter;
    const { initiator, role} = req;
    const limit = 25;
    let pageIndex = extra.pageIndex > 0 ? extra.pageIndex : 0;
    const pageJump = extra.pageJump ? (extra.pageJump * limit) : pageIndex;
    pageIndex = pageJump > 0 ? pageJump : pageIndex;

    const sort = {};
    if (extra.orderByDateCreated === "-1") {
      sort["_id"] = -1;
    }
    await actionLog(filterBy, initiator, role, 'viewUsers');
    const searchQuery = {};

    if (!filterBy.organizationId) {
        return res.status(400).json({ status: "failure", message: "organizationId id missing" });
      }

      searchQuery.organizationId = filterBy.organizationId;

    if (filterBy.userId) {
      searchQuery.userId = filterBy.userId;
    }

    if (filterBy.name) {
      searchQuery.name = { $regex: filterBy.name, $options: "i" };
    }

    if (filterBy.loginname) {
      searchQuery.loginname = { $regex: filterBy.loginname, $options: "i" };
    }

    if (filterBy.email) {
      searchQuery.email = { $regex: filterBy.email, $options: "i" };
    }

    if (filterBy.status) {
      searchQuery.status = filterBy.status;
    } else {
      searchQuery.$or = [{ status: "active" }, { status: "disabled" }];
    }

    if (filterBy.levels) {
      searchQuery.levels = filterBy.levels;
    }
    console.log(searchQuery);
    const projection =  {_id: 0, password: 0};
    const db = getDb();
    const cursor = db.collection("organization_users").find(searchQuery, {
       projection,
    sort,
    skip: pageIndex,
    limit
    });

    const users = await cursor.toArray();
    return res.status(200).json({
      status: "success",
      meaasge: users
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err.message });
  }
}

export const resetPassword = async (req, res) => {
  try {
    const userData = req.body.data?.form;
    const filterBy = req.body.data?.filter;
    const { initiator, role} = req;
    const { error, value } = resetUserSchema.validate(userData, { abortEarly: false });
      if (error) {
        const validationErrors = error.details.map(detail => detail.message);
        return res.status(400).json({ status: "failure", message: validationErrors });
    }

    await actionLog(userData, initiator, role, 'resetPassword');

    const db = getDb();
    const adminUsers = db.collection("admin_users");
    const searchQuery = { _id: new ObjectId(filterBy.userId), status: "active" };
    const adminUser = await adminUsers.findOne(searchQuery);
    if (!adminUser) {
      return res.status(400).json({ status: "failure", message: "user not found" });
    }
    const securePassword = await bcrypt.hash(value.password, 12);
    const result = await adminUsers.updateOne({loginname: adminUser.loginname}, {$set: {password: securePassword}})
    if(result.modifiedCount === 0){
      return res.status(400).json({ status: "failure", message: "password is not updated" });
    }
    return res.status(200).json({ status: "success", message: "password is updated" });

  } catch (error) {
    console.error(`Error on authAdmin: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};