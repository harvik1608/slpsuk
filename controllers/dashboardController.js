const path = require("path");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const moment = require("moment");
const Admin = require("../models/Admin");

exports.dashboard = async (req, res) => {
    const currentDate = moment().format('DD MMM, YYYY');
    const dayName = moment().format('dddd');

    const html = await ejs.renderFile(__dirname+"/../views/admin/dashboard.ejs",{currentDate:currentDate,dayName:dayName});
    res.render("include/header",{
        body: html
    });
}
exports.checkAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Admin.findOne({ where: { email } });
        if (!user) {
            return res.status(200).json({ success: false, message: "Email not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({ success: false, message: "Password does not match." });
        }
        req.session.user = user;
        return res.status(200).json({ success: true, message: "",redirect: "/admin/dashboard" });
    } catch (err) {
        console.error(err);
        return res.status(200).json({ success: false, message: "Something went wrong please try later." });
    }
}