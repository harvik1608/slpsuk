const path = require("path");

exports.loginPage = (req, res) => {
    res.render("admin/login");
}
exports.checkAdmin = (req, res) => {
    res.json(req.body);
}