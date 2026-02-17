import express from "express";
import {processLocationUpdate} from '../controller/gpslocation.controller.js'

const locationRoutes = express.Router();
//api/v1
locationRoutes.post('/buslocation', processLocationUpdate);


export default locationRoutes;