import 'dotenv/config';

const config = {
  ENV: process.env.ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGO: {
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    dbname: process.env.MONGO_INITDB_DATABASE,
    domain: process.env.MONGO_DOMAIN,
    isatlas: process.env.MONGO_ATLAS,
    mongouri: process.env.DB_MONGO_URI,
    options: {},
  },
  REDIS: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
    mode: process.env.REDIS_MODE,
    clusternode: process.env.REDIS_CLUSTER_NODES,
    sentinelnode: process.env.REDIS_SENTINEL_NODES,
    sentinelname: process.env.REDIS_SENTINEL_NAME,
  },
  SOCKET: {
    allowedorigins: process.env.ALLOWED_ORIGIN,
    credentials: process.env.CREDENTIALS,
    methods: process.env.METHODS,
    transport: process.env.TRANSPORT,
    pingtimeout: parseInt(process.env.PINGTIMEOUT),
    pinginterval: parseInt(process.env.PINGINTERVAL),
    maxdisconnectiontime: parseInt(process.env.MAXDISCONNECTIONDURATION),
    skipmiddleware: String(process.env.SKIPMIDDLEWARE) === "true",
  },
};

export default config;
