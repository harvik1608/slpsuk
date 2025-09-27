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
const eventController = require("../controllers/eventController");
const eventAttendanceController = require("../controllers/eventAttendanceController");
const announcementController = require("../controllers/announcementController");

router.get("/", adminController.loginPage);
router.post("/check-admin", adminController.checkAdmin);
router.get("/dashboard", dashboardController.dashboard);

router.get("/admins", userController.index);
router.get("/load-admins", userController.load);
router.get("/admins/create", userController.create);
router.post("/admins/store", userController.store);
router.get("/admins/edit/:id", userController.edit);
router.post("/admins/update/:id", userController.update);
router.get("/admins/delete/:id", userController.delete);

router.get("/member-requests", memberRequestController.index);
router.get("/load-member-requests", memberRequestController.load);
router.get("/member-requests/approve/:id", memberRequestController.approve);
router.get("/member-requests/reject/:id", memberRequestController.reject);
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
router.post("/committees/store",committeeController.store);
router.get("/committees/edit/:id", committeeController.edit);
router.post("/committees/update/:id", committeeController.update);
router.get("/committees/export-pdf", committeeController.export);
router.get("/committees/export-excel", committeeController.export_excel);
router.get("/committees/delete/:id", committeeController.delete);

router.get("/events", eventController.index);
router.get("/load-events", eventController.load);
router.get("/events/create", eventController.create);
router.post("/events/store",eventController.store);
router.get("/events/edit/:id", eventController.edit);
router.post("/events/update/:id", eventController.update);
router.get("/events/export-pdf", eventController.export);
router.get("/events/export-excel", eventController.export_excel);
router.get("/events/delete/:id", eventController.delete);

router.get("/event-attendances", eventAttendanceController.index);
router.get("/load-event-attendances", eventAttendanceController.load);
router.get("/event-attendances/create", eventAttendanceController.create);
router.post("/event-attendances/store",eventAttendanceController.store);
router.get("/event-attendances/edit/:id", eventAttendanceController.edit);
router.post("/event-attendances/update/:id", eventAttendanceController.update);
router.get("/event-attendances/export-pdf", eventAttendanceController.export);
router.get("/event-attendances/export-excel", eventAttendanceController.export_excel);
router.get("/event-attendances/delete/:id", eventAttendanceController.delete);

router.get("/announcements", announcementController.index);
router.get("/load-announcements", announcementController.load);
router.get("/announcements/create", announcementController.create);
router.post("/announcements/store",announcementController.store);
router.get("/announcements/edit/:id", announcementController.edit);
router.post("/announcements/update/:id", announcementController.update);
router.get("/announcements/export-pdf", announcementController.export);
router.get("/announcements/export-excel", announcementController.export_excel);
router.get("/announcements/delete/:id", announcementController.delete);

module.exports = router;