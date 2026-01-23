const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const config = require("./src/config/env");

const app = express();
 
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(cors(express.json()));
app.use(express.static(__dirname + 'public'));
app.use(express.urlencoded({ extended: true }));

if (config.ENV != "test") {
  app.use(morgan("combined"));
}

module.exports = app;
