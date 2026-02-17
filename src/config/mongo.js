import { MongoClient } from "mongodb";
import config from "./env.js";

let client;
let db;

async function connectToDatabase() {
  //console.log(">>> MONGODB_URI =" ,JSON.stringify(config));
  const MONGODB_URI =
    config.MONGO.isatlas === "true"
      ? config.MONGO.mongouri
      : `mongodb://${config.MONGO.username}:${config.MONGO.password}@${config.MONGO.domain}:27017/${config.MONGO.dbname}?authSource=admin`;
  //console.log(">>> MONGODB_URI =" ,MONGODB_URI);
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  try {
    if (!db) {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 50,
        minPoolSize: 10,
        connectTimeoutMS: 10000,
      });

      await client.connect();
      db = client.db("Placer");
      await db.command({ ping: 1 });

      console.log("MongoDB Connected successful");
    }

    //await setupIndexes();

    return { db };
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}

//  Dedicated function to keep server.js clean
async function setupIndexes() {
  try {
    await db
      .collection("location_history")
      .createIndex({ busId: 1, timestamp: -1 });
    await db.collection("buses").createIndex({ busId: 1 }, { unique: true });
    console.log("High-traffic indexes verified");
  } catch (err) {
    console.warn("Index creation failed (might already exist):", err.message);
  }
}

 const getDb = () => {
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

export { connectToDatabase, getDb };
