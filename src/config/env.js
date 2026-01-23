require("dotenv").config();

module.exports = {
  ENV: process.env.ENV || "development",
  PORT: process.env.PORT || 3000,
  MONGO: {
    uri: process.env.DB_MONGO_URI || "http://localhost:3000",
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    options: {},
  },
  REDIS: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
  },
  SOCKET: {
    allowedorigins: process.env.ALLOWED_ORIGIN,
    crdentials: process.env.CREDENTIALS,
    methods: process.env.METHODS,
    transport: process.env.TRANSPORT,
    pingtimeout: process.env.PINGTIMEOUT,
    pinginterval: process.env.PINGINTERVAL,
    maxdisconnectiontime: process.env.MAXDISCONNECTIONDURATION,
    skipmiddleware: process.env.SKIPMIDDLEWARE,
  },
};
