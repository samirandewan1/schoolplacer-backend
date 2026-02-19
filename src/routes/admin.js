import express from "express";
import { authAdmin} from "../controller/authAdmin.js";
import { resetPassword, createUser, updateUser, viewUsers } from "../controller/user.js";
import { createOrganization, editOrganization, viewOrganization, deleteOrganization, adminDashBoardCount } from "../controller/organization.js";
import { createVehicle, updateVehicle, deleteVehicle, removeVehicle, viewVehicles  } from "../controller/vehicle.js";
import { isAuth} from "../middleware/authGuard.js";
import { assignImei, updateImei, removeImei, viewImei, unassignImei  } from "../controller/imei.js";

const router = express.Router();
//admin/adminauthentication
router.post("/adminauthentication", authAdmin);


//organization

//admin/admin_dashboardcounts
router.post("/admin_dashboardcounts", isAuth, adminDashBoardCount);
//admin/create
router.post("/create", isAuth, createOrganization);
//admin/edit
router.post("/edit", isAuth, editOrganization);
//admin/view
router.post("/view", isAuth, viewOrganization);
//admin/view
router.post("/delete", isAuth, deleteOrganization);

//user

//admin/newuser
router.post("/newuser", isAuth, createUser);
//admin/viewuser
router.post("/viewuser", isAuth, viewUsers);
//admin/updateuser
router.post("/updateuser", isAuth, updateUser);
//admin/orgadmin_updatepassword
router.post("/orgadmin_updatepassword", isAuth, resetPassword);


//tracking

//
router.post("/createVehicle", isAuth, createVehicle);
router.post("/updateVehicle", isAuth, updateVehicle);
router.post("/removeVehicle", isAuth, removeVehicle);
router.post("/deleteVehicle", isAuth, deleteVehicle);
router.post("/viewVehicle", isAuth, viewVehicles);


//admin/newtracker
router.post("/addImei", isAuth, assignImei);
//admin/newtracker
router.post("/updateImei", isAuth, updateImei);
//admin/newtracker
router.post("/unassignImei", isAuth, unassignImei);
//admin/newtracker
router.post("/removeImei", isAuth, removeImei);
//admin/newtracker
router.post("/viewImei", isAuth, viewImei);



export default router;
