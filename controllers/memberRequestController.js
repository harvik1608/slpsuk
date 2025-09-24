const path = require("path");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const moment = require("moment");
const Member = require("../models/Member");
const helpers = require("../helpers/customHelper");
const { Op } = require('sequelize');
const { hasPermission } = require("../helpers/permission");

exports.index = async (req, res) => {
    console.log("Session "+req.session.user);
    if (!hasPermission(req.session.user.id, "admin", "list")) {
        return res.status(403).json({ success: false, message: "Permission denied" });
    }
    const html = await ejs.renderFile(__dirname+"/../views/admin/member_request/list.ejs");
    res.render("include/header",{
        body: html,
        hasPermission
    });
}
exports.load = async (req, res) => {
    try {
        const draw = parseInt(req.query.draw) || 0;
        const start = parseInt(req.query.start) || 0;
        const length = parseInt(req.query.length) || 10;
        const searchValue = req.query['search[value]'] || '';

        const recordsTotal = await Member.count();
        const users = await Member.findAll({
            where: {
                is_active: 'N',
                ...(searchValue && {
                    [Op.or]: [
                        { fname: { [Op.like]: `%${searchValue}%` } },
                        { mname: { [Op.like]: `%${searchValue}%` } },
                        { lname: { [Op.like]: `%${searchValue}%` } },
                        { email: { [Op.like]: `%${searchValue}%` } },
                        { mobile_no: { [Op.like]: `%${searchValue}%` } }
                    ]
                })
            },
            offset: start,
            limit: length,
            order: [['id', 'DESC']]
        });
        const recordsFiltered = searchValue ? users.length : recordsTotal;

        const formattedUsers = users.map(user => {
            return {
                id: user.id,
                name: user.fname+' '+user.mname+' '+user.lname,
                address: user.address,
                email: user.email,
                mobile_no: user.mobile_no,
                actions: `
                    <div class="edit-delete-action">
                        <a data-container="body" data-bs-toggle="tooltip" data-bs-placement="bottom" title="View" data-bs-original-title="View" class="example-popover"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></a>
                        <a href="/admin/users/edit/${helpers.encryptId(user.id)}" class="btn btn-sm btn-success">Approve</a>&nbsp;
                        <a href='javascript:;' onclick="remove_row('/admin/users/delete/${helpers.encryptId(user.id)}')" class=" btn btn-sm btn-danger">Reject</a>
                    </div>
                `
            };
        });
        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data: formattedUsers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
exports.create = async (req, res) => {
    const admin = null;
    let csrfToken = req.csrfToken();
    const html = await ejs.renderFile(__dirname+"/../views/admin/user/add_edit.ejs",{csrfToken:csrfToken,admin:admin,helpers});
    res.render("include/header",{
        body: html
    });
}
exports.store = async (req, res) => {
    try {
        let requestData = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
        const requiredParams = ["name", "mobile_no" ,"email", "password"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            const existingAdmin = await Admin.findOne({
                where: {
                    [Op.or]: [
                        { email: req.body.email },
                        { mobile_no: req.body.mobile_no }
                    ]
                }
            });
            if (existingAdmin) {
                let message = '';
                if (existingAdmin.email === req.body.email && existingAdmin.mobile_no === req.body.mobile_no) {
                    message = 'Email and Mobile No. already exist';
                } else if (existingAdmin.email === req.body.email) {
                    message = 'Email already exists';
                } else {
                    message = 'Mobile No. already exists';
                }
                return res.status(400).json({
                    success: false,
                    message
                });
            }
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const permissions = req.body.permissions || "";
            const permissionStr = JSON.stringify(permissions);

            const admin = await Admin.create({
                name: req.body.name,
                mobile_no: req.body.mobile_no,
                email: req.body.email,
                password: hashedPassword,
                permission: permissionStr,
                isActive: req.body.isActive,
                createdBy: req.session.user ? req.session.user.id : 0,
                created_at: moment().format("YYYY-MM-DD HH:mm:ss") 
            });
            res.status(200).json({success: true, message: "Admin created successfully.", data: admin});
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error });
    }
}
exports.edit = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        const adminId = helpers.decryptId(encryptedId);

        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(404).send("User not found");
        }
        let csrfToken = req.csrfToken();
        const html = await ejs.renderFile(__dirname+"/../views/admin/user/add_edit.ejs",{
            csrfToken:csrfToken,
            admin:admin,
            helpers
        });
        res.render("include/header",{
            body: html
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}
exports.update = async (req, res) => {
    try {
        let requestData = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
        const requiredParams = ["name", "mobile_no" ,"email"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            const adminId = req.params.id ? await helpers.decryptId(req.params.id) : null;
            if (!adminId) {
                return res.status(400).json({ success: false, message: "Invalid user ID" });
            }
            const existingAdmin = await Admin.findOne({
                where: {
                    id: { [Op.ne]: adminId }, 
                    [Op.or]: [
                        { email: req.body.email },
                        { mobile_no: req.body.mobile_no }
                    ]
                }
            });
            if (existingAdmin) {
                let message = '';
                if (existingAdmin.email === req.body.email && existingAdmin.mobile_no === req.body.mobile_no) {
                    message = 'Email and Mobile No. already exist';
                } else if (existingAdmin.email === req.body.email) {
                    message = 'Email already exists';
                } else {
                    message = 'Mobile No. already exists';
                }
                return res.status(400).json({
                    success: false,
                    message
                });
            }
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const permissions = req.body.permissions || "";
            const permissionStr = JSON.stringify(permissions);

            const updateData = {
                name: req.body.name,
                mobile_no: req.body.mobile_no,
                email: req.body.email,
                permission: JSON.stringify(req.body.permissions || {}),
                isActive: req.body.isActive,
                updatedBy: req.session.user ? req.session.user.id : 0,
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss") 
            };
            if (req.body.password && req.body.password.trim() !== '') {
                updateData.password = await bcrypt.hash(req.body.password, 10);
            }
            await Admin.update(updateData, { where: { id: adminId } });

            const updatedAdmin = await Admin.findByPk(adminId);
            res.status(200).json({success: true, message: "Admin updated successfully.", data: updatedAdmin});
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error });
    }
}
exports.delete = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        const adminId = parseInt(helpers.decryptId(encryptedId));
        
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(404).send("Admin not found");
        }
        await admin.update({deletedBy: req.session.user ? req.session.user.id : 0});
        await admin.destroy();
        return res.status(200).json({ success: true, message: "Admin deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}