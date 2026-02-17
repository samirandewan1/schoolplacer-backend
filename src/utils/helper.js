
import { getDb } from "../config/mongo.js";
import { encrypt } from "./crypto.js";

async function actionLog(postdata, userTracker, role, endpoint) {
  try {
    const data  = encrypt(postdata)
    const db = getDb();
    const col = db.collection('actionlog');
    await col.insertOne({data,  user: userTracker, role, endpoint, logTime: new Date().toISOString()});
  } catch{
    
  }
}

export default actionLog;