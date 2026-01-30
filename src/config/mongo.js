import { MongoClient } from "mongodb";
import config from "./env.js";

let client;
let db;

async function connectToDatabase() {
  const uri = config.MONGO.uri;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 50, 
      minPoolSize: 10,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    db = client.db("Report"); 
    
    console.log("MongoDB Connected to database: Report");

    //await setupIndexes();

    return { client, db };
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}

//  Dedicated function to keep server.js clean
async function setupIndexes() {
  try {
    await db.collection("location_history").createIndex({ busId: 1, timestamp: -1 });
    await db.collection("buses").createIndex({ busId: 1 }, { unique: true });
    console.log("High-traffic indexes verified");
  } catch (err) {
    console.warn("Index creation failed (might already exist):", err.message);
  }
}


export const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized! Call connectToDatabase first.");
  }
  return db;
};

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    console.log("Database connection closed");
  }
}

export { connectToDatabase, db, client };