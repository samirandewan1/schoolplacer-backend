import Redis from "ioredis";
import config from "./env.js";

class IORedisManager {
  constructor() {
    this.pubClient = null;
    this.subClient = null;
    this.redisClient = null;
    this.redisMode = config.REDIS.mode || "Standalone";
    this.baseOption = {
      password: config.REDIS.password,
      retryStrategy: (times) => {
        if (times > 4) {
          console.log("Redis will ignore after 4 retry");
          return null;
        }
        // otherwise wait before next retry
        const delay = Math.min(times * 200, 2000);
        console.log(`Redis retry #${times}, delaying ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          // Reconnect only on "READONLY" errors, which occur during Redis primary failover
          // when a replica is promoted and the old primary temporarily rejects writes
          return true;
        }
      },
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      //   enableOfflineQueue: false,
    };
  }

  async init() {
    if (this.redisMode == "Cluster" || this.redisMode == "Sentinel") {
       await this.initCluster();
    }if (this.redisMode == "Sentinel"){
       await this.initSentinel();
    } 
    else {
      console.log("else part");
      await this.initStandalone('standalone');
    }
    return this;
  }

  async initCluster() {
    const nodes = config.REDIS.clusternode.split(",").map((node) => {
      const [host, port] = node.split(":");
      return { host, port: parseInt(port) };
    });
    const name = "cluster";
    if (!nodes.length) {
      throw new Error("REDIS_NODES is required for this setup");
    }

    const clusterOptions = {
      ...this.baseOption,
      scaleReads: "slave",
      slotsRefreshTimeout: 2000,
    };

    this.redisClient = new Redis.Cluster(nodes, {
      ...clusterOptions,
      connectionName: `redis-${name}-client`,
    });

    this.pubClient = new Redis.Cluster(nodes, {
      ...clusterOptions,
      connectionName: `redis-${name}-pub`,
    });

    this.subClient = new Redis.Cluster(nodes, {
      ...clusterOptions,
      connectionName: `redis-${name}-sub`,
    });
    this.registerEvents(this.redisClient, `${name}-CLINET`);
    this.registerEvents(this.pubClient, `${name}-PUB`);
    this.registerEvents(this.subClient, `${name}-SUB`);
    
  }

  async initSentinel() {
    const sentinels = config.REDIS.sentinelnode.split(",").map((node) => {
      const [host, port] = node.split(":");
      return { host, port: parseInt(port) };
    });
    const name = "sentinel";
    if (!sentinels.length) {
      throw new Error("REDIS_NODES is required for this setup");
    }

    const sentinelOptions = {
      ...this.baseOption,
    };

    this.redisClient = new Redis(sentinels, {
      ...clusterOptions,
      connectionName: `redis-${name}-client`,
    });

    this.pubClient = new Redis(sentinels, {
      ...clusterOptions,
      name: 'master',
      connectionName: `redis-${name}-pub`,
    });

    this.subClient = new Redis(sentinels, {
      ...clusterOptions,
      connectionName: `redis-${name}-sub`,
    });
    this.registerEvents(this.redisClient, `${name}-CLINET`);
    this.registerEvents(this.pubClient, `${name}-PUB`);
    this.registerEvents(this.subClient, `${name}-SUB`);
    
  }

  async initStandalone(name) {
    const options = {
      ...this.baseConfig,
      host: config.REDIS.host,
      port: config.REDIS.port,
      password: config.REDIS.password,
      db: config.REDIS.db,
    };
    // console.log(JSON.stringify({...options, connectionName: `redis-${name}-pub` }));
    this.redisClient = new Redis({...options, connectionName: `redis-${name}-client`});
    this.pubClient = new Redis({...options, connectionName: `redis-${name}-pub`});
    this.subClient = new Redis({...options, connectionName: `redis-${name}-sub`});
   
    this.registerEvents(this.redisClient, `${name}-CLIENT`);
    this.registerEvents(this.pubClient, `${name}-PUB`);
    this.registerEvents(this.subClient, `${name}-SUB`);
  }
  registerEvents(client, label) {
    client.on("connect", () => console.log(`[Redis:${label}] Connected`));

    client.on("ready", () => console.log(`[Redis:${label}] Ready`));

    client.on("error", (err) => console.error(`[Redis:${label}] Error`, err));

    client.on("close", () =>
      console.warn(`[Redis:${label}] Connection closed`),
    );
  }

  getPublisher() {
    return this.pubClient;
  }

  getSubscriber() {
    return this.subClient;
  }

  getRedisClient() {
    return this.redisClient;
  }

  async shutdown() {
    await Promise.allSettled([
      this.pubClient?.quit(),
      this.subClient?.quit(),
      this.redisClient?.quit(),
    ]);
  }
}

export default new IORedisManager();
