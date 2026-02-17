import express from "express";
import { authAdmin, orgStats, createUser, updateUser,viewUsers,orgView, addImei, updateImei} from "../controller/authAdmin.js";
import { resetPassword, createUser, updateUser, viewUsers } from "../controller/users.js";
import { createOrganization, editOrganization } from "../controller/organization.js";
import { isAuth} from "../middleware/authGuard.js";

const router = express.Router();
//admin/adminauthentication
router.post("/adminauthentication", authAdmin);


//organization

//admin/admin_dashboardcounts
router.post("/admin_dashboardcounts", isAuth, orgStats);
//admin/create
router.post("/create", isAuth, createOrganization);
//admin/edit
router.post("/edit", isAuth, editOrganization);
//admin/view
router.post("/view", isAuth, orgView);

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

//admin/newtracker
router.post("/addImei", isAuth, addImei);
//admin/newtracker
router.post("/updateImei", isAuth, updateImei);



export default router;
