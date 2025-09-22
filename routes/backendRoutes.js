const express = require("express");
const axios = require("axios");
const ejs = require("ejs");
const router = express.Router();
const CONSTANT = require("../config/constants");
const qs = require("qs");
const adminController = require("../controllers/adminController");
const dashboardController = require("../controllers/dashboardController");

router.get("/admin", adminController.loginPage);
router.post("/admin/check-admin", adminController.checkAdmin);
router.get("/admin/dashboard", dashboardController.dashboard);
module.exports = router;