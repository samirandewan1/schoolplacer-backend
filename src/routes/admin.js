import express from "express";
import { authAdmin, orgStats, resetPassword, createOrganization, updateOrganization, createUser, updateUser,viewUsers,orgView, addImei, updateImei} from "../controller/authAdmin.js";
import { isAuth} from "../middleware/authGuard.js";

const adminRoutes = express.Router();
//admin/adminauthentication
adminRoutes.post("/adminauthentication", authAdmin);
//admin/admin_dashboardcounts
adminRoutes.post("/admin_dashboardcounts", isAuth, orgStats);
//admin/create
adminRoutes.post("/create", isAuth, createOrganization);
//admin/view
adminRoutes.post("/view", isAuth, orgView);
//admin/edit
adminRoutes.post("/edit", isAuth, updateOrganization);
//admin/newuser
adminRoutes.post("/newuser", isAuth, createUser);
//admin/viewuser
adminRoutes.post("/viewuser", isAuth, viewUsers);
//admin/updateuser
adminRoutes.post("/updateuser", isAuth, updateUser);
//admin/newtracker
adminRoutes.post("/addImei", isAuth, addImei);
//admin/newtracker
adminRoutes.post("/updateImei", isAuth, updateImei);
//admin/orgadmin_updatepassword
adminRoutes.post("/orgadmin_updatepassword", isAuth, resetPassword);

export default adminRoutes;
