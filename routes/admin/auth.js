const express = require("express");
const axios = require("axios");
const ejs = require("ejs");
const router = express.Router();
const CONSTANT = require("../../config/constants");
const qs = require("qs");
const adminController = require("../../controllers/adminController");

router.get("/admin", adminController.loginPage);
router.post("/check-admin", adminController.checkAdmin);
module.exports = router;