const express = require("express");
const axios = require("axios");
const ejs = require("ejs");
const router = express.Router();
const CONSTANT = require("../config/constants");
const qs = require("qs");
const adminController = require("../controllers/adminController");
const dashboardController = require("../controllers/dashboardController");
const userController = require("../controllers/userController");
const memberRequestController = require("../controllers/memberRequestController");
const memberController = require("../controllers/memberController");

router.get("/", adminController.loginPage);
router.post("/check-admin", adminController.checkAdmin);
router.get("/dashboard", dashboardController.dashboard);

router.get("/users", userController.index);
router.get("/load-users", userController.load);
router.get("/users/create", userController.create);
router.post("/users/store", userController.store);
router.get("/users/edit/:id", userController.edit);
router.post("/users/update/:id", userController.update);
router.get("/users/delete/:id", userController.delete);

router.get("/member-requests", memberRequestController.index);
router.get("/load-member-requests", memberRequestController.load);
router.post("/member-requests/approve", memberRequestController.approve);
router.post("/member-requests/reject", memberRequestController.reject);
router.get("/member-requests/view/:id", memberRequestController.view);

router.get("/members", memberController.index);
router.get("/load-members", memberController.load);
router.get("/members/create", memberController.create);
router.get("/members/export", memberController.export);
router.get("/members/view/:id", memberController.view);
module.exports = router;