const path = require("path");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const moment = require("moment");
const Admin = require("../models/Admin");

exports.dashboard = async (req, res) => {
    const currentDate = moment().format('DD MMM, YYYY');
    const dayName = moment().format('dddd');
    res.render("admin/dashboard", {currentDate,dayName});
}