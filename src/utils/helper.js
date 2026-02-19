
import { getDb } from "../config/mongo.js";
import { encrypt } from "./crypto.js";

  export const actionLog = async(postdata, userTracker, role, endpoint) =>{
  try {
    //console.log(userTracker);
    const data  = encrypt(JSON.stringify(postdata))
    const db = getDb();
    const col = db.collection('actionLog');
    await col.insertOne({data,  user: userTracker, role, endpoint, logTime: new Date().toISOString()});
  } catch(error){
    console.log(error);
  }
}

export const parseBool =(val) =>{
  if (val === true || val === 'true') return true;
  if (val === false || val === 'false') return false;
  return undefined;
}

export default actionLog;