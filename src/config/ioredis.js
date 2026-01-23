const Redis = require("ioredis");
const config = require("./env");

let pub = null;
let sub = null;

const ioRedisClient = () => {
  const options = {
    host: config.REDIS.host,
    port: config.REDIS.port,
    password: config.REDIS.password,
    db: config.REDIS.db,
    connectionName: `schoolplacer-${config.ENV}`,
    retryStrategy(times) {
      if (times > 4) {
        console.log("Redis will ignore after 4 retry");
        return null;
      }
      // otherwise wait before next retry
      const delay = Math.min(times * 200, 2000);
      console.log(`Redis retry #${times}, delaying ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 1,
    reconnectOnError(err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        // In distributed systems like Redis Cluster or AWS ElastiCache, when a Primary node fails,
        // a Replica is promoted to Primary. During this handover, the old Primary node may still accept connections but will reject write commands with an error message containing "READONLY"
        return true; // or `return 1;`
      }
    },
  };
  const redisClient = new Redis(options);
  redisClient.on("ready", () => {
    console.log("redis is ready");
  });
  redisClient.on("error", (err) => {
    console.log("redis error: " + err.message);
  });
  redisClient.on("close", () => {
    console.log("redis connection closed");
  });
  redisClient.on("reconnecting", (delay) => {
    console.log("redis reconnecting in " + delay);
  });

  return redisClient;
};

const getPubSub = () => {
  pub = ioRedisClient();
  sub = ioRedisClient();
  return { pub, sub };
};

module.exports = { ioRedisClient, getPubSub };
