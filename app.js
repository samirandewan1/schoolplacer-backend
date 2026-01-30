import path from "path";
import rootDir from "./src/utils/path.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import bodyParser from "body-parser";
import config from "./src/config/env.js";
import router from "./src/routes/gpslocation.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(rootDir + "public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(rootDir, "public")));

app.use("/api/v1", router);



app.get("/ping", (req, res)=>{
  res.status(200).send('Hello')
});

if (config.ENV != "test") {
  app.use(morgan("combined"));
}

export default app;
