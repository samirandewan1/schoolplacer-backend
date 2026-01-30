import express from "express";
import {processLocationUpdate} from '../controller/gpslocation.controller.js'

const router = express.Router();
//api/v1
router.post('/buslocation', processLocationUpdate);


export default router;