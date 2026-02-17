import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import config from "../config/env.js";
import { createOrgSchema, updateOrgSchema } from "../validator/orgSchema.js";
import { createUserSchema, updateUserSchema } from "../validator/orgUserSchema.js";
import { addVehicleSchema, updateVehicleSchema, addImeaSchema, updateImeaSchema } from "../validator/trackerSchema.js";


export const authAdmin = async (req, res) => {
  try {
    const loginname = req.body.data.form?.loginname;
    const password = req.body.data.form?.password;
    if (!loginname || !password) {
      return res.status(400).json({ status: "failure", msg: "Missing input" });
    }
    const db = getDb();
    const adminUsers = db.collection("admin_users");
    const searchQuery = { loginname: loginname, status: "active" };
    const adminUser = await adminUsers.findOne(searchQuery);
    if (!adminUser) {
      return res.status(401).json({ status: "failure", message: "user not found" });
    }
    //pw1  ===  $2b$12$XRVptW8WXZsXn3kETLqebeW4ID74fsLEmJSQ7g/XtCb57OLIUja9a
    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) return res.status(401).json({ status: "failure", message: "Wrong password" });
    const token = jwt.sign({ id: adminUser.loginname, role: "admin" }, config.SECRET.jwt_key, { expiresIn: "1d" });
    return res.json({ status: "success", token });
  } catch (error) {
    console.error(`Error on authAdmin: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};

export const orgStats = async (req, res) => {
  try {
    // await OrgUsersActionLog(
    //     postdata,
    //     userTracker,
    //     "admin",
    //     req.originalUrl
    // );
    const query = { status: "active" };

    const [
      ActiveOrgCount,
      ActiveTrackerCount,
      ActiveAdminUC,
      ActiveOrgAdminUC,
    ] = await Promise.all([
      mongoCount(query, "organization"),
      mongoCount(query, "organization_tracker"),
      mongoCount(query, "admin_users"),
      mongoCount(query, "organization_users"),
    ]);

    const TotalOrgRPMcount = {
      AdminStats: {
        activeOrgCount: ActiveOrgCount,
        activeTrackerCount: ActiveTrackerCount,
        activeAdminUC: ActiveAdminUC,
        activeOrgAdminUC: ActiveOrgAdminUC,
      },
    };
    return res.status(2000).json({status: "success", response: TotalOrgRPMcount});
  } catch (err) {
    console.error("Internal Error:", err);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const loginname = req.body.data.form?.loginname;
    const password = req.body.data.form?.password;
    if (!loginname || !password) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const db = getDb();
    const adminUsers = db.collection("admin_users");
    const searchQuery = { loginname: loginname, status: "active" };
    const adminUser = await adminUsers.findOne(searchQuery);
    if (!adminUser) {
      return res.status(400).json({ status: "failure", message: "user not found" });
    }
    const securepassword = await bcrypt.hash(password, 12);
    const result = await adminUsers.updateOne({loginname: adminUser.loginname}, {$set: {password: securepassword, modified: new Date()}})
    if(result.modifiedCount === 0){
      return res.status(400).json({ status: "failure", message: "password not updated" });
    }
    return res.status(200).json({ status: "success", message: "password updated" });

  } catch (error) {
    console.error(`Error on authAdmin: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};

export const createOrganization = async (req, res) => {
  try {
    const orgData = req.body.data?.form;
    if (!orgData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const db = getDb();
    const orgColl = db.collection("organization");
    const searchQuery = { name: orgData.name, status: "active" };
    const { error, value } = createOrgSchema.validate(orgData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: "failure", message: validationErrors });
    }
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

export const updateOrganization = async (req, res) => {
  try {
    const orgData = req.body.data?.form;
    const orgId = req.body.data.filter?.organizationId;
    if (!orgData || !orgId) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const db = getDb();
    const orgColl = db.collection("organization");
    const { error, value } = updateOrgSchema.validate(orgData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: "failure", message: validationErrors });
    }
    const {acknowledged} = await orgColl.updateOne({_id: new ObjectId(orgId)}, {$set: value});
    if(acknowledged){
      return res.status(200).json({ status: "success", message: "record updated successfully" });
    }
     return res.status(400).json({ status: "failure", message: "failed to update the record" });

  } catch (error) {
    console.error(`Error on updateOrganization: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};


export const createUser = async (req, res) => {
  try {
    const userData = req.body.data?.form;
    if (!userData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const db = getDb();
    const userColl = db.collection("organization_users");
    const searchQuery = { loginname: userData.loginname, organizationId: userData.organizationId };
    const user = await userColl.findOne(searchQuery);
    if (user) {
      return res.status(400).json({ status: "failure", message: "user already exist" });
    }
    const { error, value } = createUserSchema.validate(userData, { abortEarly: false });
    if (error) {
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({ status: "failure", message: validationErrors });
    }
    const securePassword = await bcrypt.hash(value.password, 12);
    const { acknowledged, insertedId } = await userColl.insertOne({...value, password: securePassword});
    if(acknowledged){
      return res.status(200).json({ status: "success", message: insertedId });
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
    const searchQuery = { loginname: loginname, status: "active", organizationId: orgId, _id: { $ne: new ObjectId(userId) } };
    const exists = await userColl.findOne(searchQuery);
    if (exists) {
       return res.status(400).json({ status: "failure", message: "user already exist."});
    }
     if(value.password){
       const securePassword = await bcrypt.hash(value.password, 12);
       value.password = securePassword;
     }
    const result = await userColl.updateOne({_id: new ObjectId(userId), organizationId: orgId}, {$set: value});
    console.log(JSON.stringify(result));
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
    const limit = 25;
    let pageIndex = extra.pageIndex > 0 ? extra.pageIndex : 0;
    const pageJump = extra.pageJump ? (extra.pageJump * limit) : pageIndex;
    pageIndex = pageJump > 0 ? pageJump : pageIndex;

    const sort = {};
    if (extra.orderByDateCreated === "-1") {
      sort["_id"] = -1;
    }

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
      searchQuery.loginName = { $regex: filterBy.loginname, $options: "i" };
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

export const orgView = async (req, res) => {
 
  try {
    const extra = req.body.data?.extra;
    const filterBy = req.body.data?.filter;
    const limit = 10;
    let pageIndex = extra.pageIndex > 0 ? extra.pageIndex : 0;
    const pageJump = extra.pageJump ? (extra.pageJump * limit) : pageIndex;
    pageIndex = pageJump > 0 ? pageJump : pageIndex;

    const sort = {};
    if (extra.orderByDateCreated === "-1") {
      sort["_id"] = -1;
    }

    const searchQuery = {};
    // const searchQuery2 = {};
     let orgFlag = 0;

    // if (!filterBy.organizationId) {
    //     return res.status(400).json({ status: "failure", message: "organizationId id missing" });
    //   }

    //   searchQuery.organizationId = filterBy.organizationId;
//     if (filterBy.regNo) {
//     $orgFlag = 1;
//     $searchQuery.regno = $controller->mongo->regexGeneral($filterBy->regNo, 'i');
// }

// if ($filterBy->boxId) {
//     $orgFlag = 1;
//     $searchQuery2['boxid'] = $filterBy->boxId;
// }

// if ($filterBy->imei) {
//     $orgFlag = 1;
//     $searchQuery2['$or'] = [['imei' => $filterBy->imei], ['imei2' => $filterBy->imei]];
// }

// if ($filterBy->simCard) {
//     $orgFlag = 1;
//     $searchQuery2['simCard'] = $filterBy->simCard;
// }

// if ($orgFlag == 1) {

//     $searchQuery2['status'] = 'active';
//     // print_r($searchQuery2);print_r("\n");

//     $orgInfoObject = $controller->mongo->findOne($searchQuery2, 'organization_tracker', [
//         'filter' => [
//             'projection' => ['organizationTracker' => 1],
//         ],
//     ]);

// // print_r($orgInfoObject);print_r("\n");

//     if ($orgInfoObject->organizationTracker) {
//         $filterBy->organizationId = $orgInfoObject->organizationTracker;
//     }

// }
// print_r($filterBy->organizationId);exit();

if (filterBy.organizationId) {
    searchQuery.organizationId = filterBy.organizationId;
}

if (filterBy.name) {
   searchQuery.name = { $regex: filterBy.name, $options: "i" };
  
}

if (filterBy.category) {
    searchQuery.category = { $regex: filterBy.category, $options: "i" };
}

if (filterBy.city) {
    searchQuery.city = { $regex: filterBy.city, $options: "i" };
    
}

if (filterBy.state) {
    searchQuery.state = { $regex: filterBy.state, $options: "i" };
}

if (filterBy.country) {
  searchQuery.country = { $regex: filterBy.country, $options: "i" };
 
}

if (filterBy.email) {
    searchQuery.email = { $regex: filterBy.email, $options: "i" };;
}

if (filterBy.location) {
  searchQuery['$or'] = [
    { area: { $regex: filterBy.location, $options: 'i' } },
    { city: { $regex: filterBy.location, $options: 'i' } },
    { state: { $regex: filterBy.location, $options: 'i' } }
];
   
}

if (filterBy.smsAlert) {
    if (filterBy.smsAlert == 'true') {
        searchQuery.smsAlert = true;
    } else {
        searchQuery.smsAlert = false;
    }

}

if (filterBy.appAlert) {
    if (filterBy.appAlert == 'true') {
        searchQuery['appAlert'] = true;
    } else {
        searchQuery['appAlert'] = false;
    }

}

if (filterBy.emailAlert) {
    if (filterBy.emailAlert == 'true') {
        searchQuery['emailAlert'] = true;
    } else {
        searchQuery['emailAlert'] = false;
    }

}

if (filterBy.callAlert) {
    if (filterBy.callAlert == 'true') {
        searchQuery.callAlert = true;
    } else {
        searchQuery.callAlert = false;
    }

}

if (filterBy.rfidAlert) {
    if (filterBy.rfidAlert == 'true') {
        searchQuery.rfidAlert = true;
    } else {
        searchQuery.rfidAlert = false;
    }

}


if (filterBy.etaAlert) {
    if (filterBy.etaAlert == 'true') {
        searchQuery.etaAlert = true;
    } else {
        searchQuery.etaAlert = false;
    }

}



if (filterBy.alertlock) {
    if (filterBy.alertlock == 'true') {
        searchQcsnuery.alertlock = true;
    } else {
        searchQuery.alertlock = false;
    }

}

searchQuery.status = 'active';

    
    const projection =  {_id: 0, password: 0};
    const db = getDb();
    const cursor = db.collection("organization").find(searchQuery, {
       projection,
    sort,
    skip: pageIndex,
    limit
    });

    const orgnization = await cursor.toArray();
    return res.status(200).json({
      status: "success",
      meaasge: orgnization
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err.message });
  }
}

export const addImei = async (req, res) => {
  try {
    const imeiData = req.body.data.form?.imeiInformation;
    if (!imeiData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const { error, value } = addImeaSchema.validate(imeiData, { abortEarly: false });
    if (error) {
       validationErrors = error.details.map(detail => detail.message);
       return res.status(400).json({ status: "failure", message: validationErrors });
    }
    
    // let searchQuery = {};
    // if (imeiData.imei) {
    //   searchQuery.$or = [
    //     { imei: imeiData.imei },
    //     { imei2: imeiData.imei }
    //   ];
    // }
    // if (imeiData.imei2) {
    //   searchQuery.$or = [
    //     { imei: imeiData.imei2 },
    //     { imei2: imeiData.imei2 }
    //   ];
    // }
    let orArray = [];
    if(imeiData.imei) {
        orArray.push({ imei: imeiData.imei });
        orArray.push({ imei2: imeiData.imei });
       }
    if(imeiData.imei2) {
        orArray.push({ imei: imeiData.imei2 });
        orArray.push({ imei2: imeiData.imei2 });
      }
    const db = getDb();
    const imeiColl = db.collection("organization_imeis");
    
    const  imei = await imeiColl.findOne({ $or: orArray });
    console.log({$or: orArray });
    if (imei) {
      return res.status(400).json({ status: "failure", message: "imei already exist" });
    } 
    const { acknowledged, insertedId } = await imeiColl.insertOne(value);
    if(acknowledged){
      return res.status(200).json({ status: "success", message: insertedId });
    }
    return res.status(400).json({ status: "failure", message: "failed to insert the imei record" });

  } catch (error) {
    console.error(`Error on addImei: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
}

export const updateImei = async (req, res) => {
  try {
    const imeiData = req.body.data.form?.imeiInformation;
    if (!imeiData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const { error, value } = updateImeaSchema.validate(imeiData, { abortEarly: false });
    if (error) {
       validationErrors = error.details.map(detail => detail.message);
       return res.status(400).json({ status: "failure", message: validationErrors });
    }
    
     let orArray = [];
    if(imeiData.imei) {
        orArray.push({ imei: imeiData.imei });
        orArray.push({ imei2: imeiData.imei });
       }
    if(imeiData.imei2) {
        orArray.push({ imei: imeiData.imei2 });
        orArray.push({ imei2: imeiData.imei2 });
      }
      orArray.push({status: 'active'})
   
    const db = getDb();
    const imeiColl = db.collection("organization_imeis");
    const  imei = await imeiColl.findOne({$or: orArray });
    const orgId = imeiData.organizationId
    if (imei) {
       return res.status(400).json({ status: "failure", message: "active imei can not be updated"});
    }
    




    const result = await imeiColl.updateOne({organizationId: orgId}, {$set: value});
    if(result.acknowledged){
      return res.status(200).json({ status: "success", message: "Imei updated successfully" });
    }
     return res.status(400).json({ status: "failure", message: "failed to update the record" });

  } catch (error) {
    console.error(`Error on updateImei: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};

export const addVehicle = async (req, res) => {
  try {
    const vehicleData = req.body.data.form?.vehicleInformation;
    if (!vehicleData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const { error, value } = addVehicleSchema.validate(vehicleData, { abortEarly: false });
    if (error) {
       validationErrors = error.details.map(detail => detail.message);
       return res.status(400).json({ status: "failure", message: validationErrors });
    }
    
    const db = getDb();
    const vehicleColl = db.collection("organization_vehicles");
   
    const { acknowledged, insertedId } = await vehicleColl.insertOne(value);
    if(acknowledged){
      return res.status(200).json({ status: "success", message: insertedId });
    }
    return res.status(400).json({ status: "failure", message: "failed to insert the vehicle record" });

  } catch (error) {
    console.error(`Error on addVehicle: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
}

export const updateVehicle = async (req, res) => {
  try {
    const vehicleData = req.body.data.form?.vehicleInformation;
    if (!vehicleData) {
      return res.status(400).json({ status: "failure", message: "Missing input" });
    }
    const { error, value } = updateVehicleSchema.validate(imeiData, { abortEarly: false });
    if (error) {
       validationErrors = error.details.map(detail => detail.message);
       return res.status(400).json({ status: "failure", message: validationErrors });
    }
    
    
    searchQuery.status = 'active';
    const db = getDb();
    const vehicleColl = db.collection("organization_vehicles");
    const  vehicle = await vehicleColl.findOne(searchQuery);
    const orgId = vehicleColl.organizationId
    if (imei) {
       return res.status(400).json({ status: "failure", message: "active imei can not be updated"});
    }
    const result = await imeiColl.updateOne({organizationId: orgId}, {$set: value});
    if(result.acknowledged){
      return res.status(200).json({ status: "success", message: "Imei updated successfully" });
    }
     return res.status(400).json({ status: "failure", message: "failed to update the record" });

  } catch (error) {
    console.error(`Error on updateImei: ${error}`);
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};


