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

        const whereCondition = {
            is_active: 'P',
            member_id: 0,
            ...(searchValue && {
                [Op.or]: [
                    { fname: { [Op.like]: `%${searchValue}%` } },
                    { mname: { [Op.like]: `%${searchValue}%` } },
                    { lname: { [Op.like]: `%${searchValue}%` } },
                    { email: { [Op.like]: `%${searchValue}%` } },
                    { address: { [Op.like]: `%${searchValue}%` } },
                    { mobile_no: { [Op.like]: `%${searchValue}%` } }
                ]
            })
        };
        const recordsTotal = await Member.count({ where: whereCondition });
        const users = await Member.findAll({
            where: whereCondition,
            offset: start,
            limit: length,
            order: [['id', 'DESC']]
        });
        const recordsFiltered = searchValue ? users.length : recordsTotal;

        const formattedUsers = users.map((user, index) => {
            return {
                id: start + index + 1,
                name: user.fname+' '+user.mname+' '+user.lname,
                email: user.email,
                mobile_no: user.mobile_no,
                actions: `
                    <div class="edit-delete-action">
                        <div class="edit-delete-action">
                            <a class="me-2 edit-icon p-2" href="/admin/member-requests/view/${helpers.encryptId(user.id)}" title="View">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </a>
                            <a href="javascript:;" onclick="approve_member_request('${helpers.encryptId(user.id)}')" class="me-2 edit-icon p-2 text-success" title="Approve"><i class="fas fa-check me-1"></i></a>
                            <a href="javascript:;" onclick="reject_member_request('${helpers.encryptId(user.id)}')" class="me-2 edit-icon p-2 text-danger" title="Reject"><i class="fas fa-times me-1"></i></a>
                        </div>
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
exports.view = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        const memberId = helpers.decryptId(encryptedId);

        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(404).send("Member not found");
        }
        let csrfToken = req.csrfToken();
        const html = await ejs.renderFile(__dirname+"/../views/admin/member/view.ejs",{
            csrfToken:csrfToken,
            member:member,
            moment: moment,
            page_title: "Member Request List",
            helpers
        });
        res.render("include/header",{
            body: html
        });
    } catch (error) {
        console.log(error);
        res.redirect('/admin/member-requests');
    }
}
exports.approve = async (req, res) => {
    try {
        const encryptedId = req.body.member_id;
        const memberId = parseInt(helpers.decryptId(encryptedId));
        
        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(404).send("Admin not found");
        }
        await member.update({is_active: 'Y'});
        return res.status(200).json({ success: true, message: "Request approved successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}
exports.reject = async (req, res) => {
    try {
        const encryptedId = req.body.member_id;
        const memberId = parseInt(helpers.decryptId(encryptedId));
        
        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(404).send("Request not found");
        }
        await member.update({is_active: 'R'});
        return res.status(200).json({ success: true, message: "Request rejected successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}