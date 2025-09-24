const path = require("path");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

exports.loginPage = (req, res) => {
    res.render("admin/login", {
        csrfToken: req.csrfToken() // pass token to EJS
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
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile_no: user.mobile_no,
            role: user.role,
            permission: user.permission
        };
        await req.session.save();
        return res.status(200).json({ success: true, message: "",redirect: "/admin/dashboard" });
    } catch (err) {
        console.error(err);
        return res.status(200).json({ success: false, message: "Something went wrong please try later." });
    }
}