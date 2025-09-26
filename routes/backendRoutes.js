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
const familyMemberController = require("../controllers/familyMemberController");
const committeeController = require("../controllers/committeeController");

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
router.post("/members/store", memberController.store);
router.get("/members/edit/:id", memberController.edit);
router.post("/members/update/:id", memberController.update);
router.get("/members/export-pdf", memberController.export);
router.get("/members/export-excel", memberController.export_excel);
router.get("/members/view/:id", memberController.view);
router.get("/members/delete/:id", memberController.delete);

router.get("/family-members", familyMemberController.index);
router.get("/load-family-members", familyMemberController.load);
router.get("/family-members/export-pdf", familyMemberController.export);
router.get("/family-members/export-excel", familyMemberController.export_excel);
router.get("/family-members/delete/:id", familyMemberController.delete);

router.get("/committees", committeeController.index);
router.get("/load-committees", committeeController.load);
router.get("/committees/create", committeeController.create);
router.post("/committees/store", committeeController.store);
router.get("/committees/edit/:id", committeeController.edit);
router.post("/committees/update/:id", committeeController.update);
router.get("/committees/export-pdf", committeeController.export);
router.get("/committees/export-excel", committeeController.export_excel);
router.get("/committees/delete/:id", committeeController.delete);
module.exports = router;