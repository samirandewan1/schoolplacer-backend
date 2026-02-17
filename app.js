import path from "path";
import rootDir from "./src/utils/path.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import bodyParser from "body-parser";
import config from "./src/config/env.js";
import locationRoutes from "./src/routes/location.js";
import router from "./src/routes/admin.js"
import { isAuth } from "./src/middleware/authGuard.js";


const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(rootDir + "public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(rootDir, "public")));

//Admin Routes
app.use("/admin", router);

// //Organization Routes
// app.use("/admin", adminRoutes);

//Location Routes
app.use("/api/v1", locationRoutes);



app.get("/ping", isAuth, (req, res)=>{
  res.status(200).send('Hello')
});

if (config.ENV != "test") {
  app.use(morgan("combined"));
}

export default app;
