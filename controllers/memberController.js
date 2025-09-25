const path = require("path");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const moment = require("moment");
const puppeteer = require("puppeteer");
const Member = require("../models/Member");
const helpers = require("../helpers/customHelper");
const { Op } = require('sequelize');
const { hasPermission } = require("../helpers/permission");

exports.index = async (req, res) => {
    if (!hasPermission(req.session.user.id, "member", "list")) {
        return res.status(403).json({ success: false, message: "Permission denied" });
    }
    const html = await ejs.renderFile(__dirname+"/../views/admin/member/list.ejs");
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
            is_active: 'Y',
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
                member_id: user.id,
                name: user.fname+' '+user.mname+' '+user.lname,
                email: user.email,
                mobile_no: user.mobile_no,
                family_members: user.family_member,
                created_at: helpers.format_date(user.createdAt),
                actions: `
                    <div class="edit-delete-action">
                        <div class="edit-delete-action">
                            <a class="me-2 edit-icon p-2" href="/admin/members/view/${helpers.encryptId(user.id)}" title="View">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </a>
                            <a href="javascript:;" onclick="approve_member_request('${helpers.encryptId(user.id)}')" class="me-2 edit-icon p-2 text-success" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></a>
                            <a href="javascript:;" onclick="reject_member_request('${helpers.encryptId(user.id)}')" class="me-2 edit-icon p-2 text-danger" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></a>
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
        const family_members = await Member.findAll({
            where: {
                member_id: memberId
            },
            order: [['id', 'DESC']]
        });
        const html = await ejs.renderFile(__dirname+"/../views/admin/member/view.ejs",{
            member:member,
            family_members: family_members,
            moment: moment,
            page_title: "Member List",
            helpers
        });
        res.render("include/header",{
            body: html
        });
    } catch (error) {
        console.log(error);
        res.redirect('/admin/members');
    }
}
exports.export = async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent("<h1>Hello World PDF</h1>");

    await page.pdf({
        path: "output.pdf",
        format: "A4",
        printBackground: true
    });

    await browser.close();
}