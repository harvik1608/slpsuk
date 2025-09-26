const path = require("path");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const moment = require("moment");
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const Committee = require("../models/Committee");
const helpers = require("../helpers/customHelper");
const { Op } = require('sequelize');
const { hasPermission } = require("../helpers/permission");

exports.index = async (req, res) => {
    if (!hasPermission(req.session.user.id, "committee", "list")) {
        return res.status(403).json({ success: false, message: "Permission denied" });
    }
    const html = await ejs.renderFile(__dirname+"/../views/admin/committee/list.ejs");
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
            ...(searchValue && {
                [Op.or]: [
                    { name: { [Op.like]: `%${searchValue}%` } },
                    { position: { [Op.like]: `%${searchValue}%` } },
                    { email: { [Op.like]: `%${searchValue}%` } },
                    { mobile: { [Op.like]: `%${searchValue}%` } }
                ]
            })
        };

        const recordsTotal = await Committee.count({ where: whereCondition });
        const rows = await Committee.findAll({
            where: whereCondition,
            offset: start,
            limit: length,
            order: [['id', 'DESC']]
        });
        const recordsFiltered = searchValue ? rows.length : recordsTotal;

        const formattedCommittee = rows.map((committee, index) => {
            return {
                id: start + index + 1,
                name: committee.name,
                position: committee.position,
                email: committee.email,
                mobile: committee.mobile,
                status: committee.isActive ? '<span class="badge badge-success badge-xs d-inline-flex align-items-center">Active</span>' : '<span class="badge badge-danger badge-xs d-inline-flex align-items-center">Inactive</span>',
                actions: `
                    <div class="edit-delete-action">
                        <div class="edit-delete-action">
                            <a href="/admin/committees/edit/${helpers.encryptId(committee.id)}" class="me-2 edit-icon p-2 text-success" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></a>
                            <a href='javascript:;' onclick="remove_row('/admin/committees/delete/${helpers.encryptId(committee.id)}')" data-bs-toggle="modal" data-bs-target="#delete-modal" class="p-2" href="javascript:void(0);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></a>
                        </div>
                    </div>
                `
            };
        });
        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data: formattedCommittee
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
exports.create = async (req, res) => {
    const committee = null;
    let csrfToken = req.csrfToken();
    const html = await ejs.renderFile(__dirname+"/../views/admin/committee/add_edit.ejs",{
        csrfToken:csrfToken,
        committee,
        helpers
    });
    res.render("include/header",{
        body: html
    });
}
exports.store = async (req, res) => {
    try {
        let requestData = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
        const requiredParams = ["name","position","email","mobile"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            const existingCommittee = await Committee.findOne({where: {email:  req.body.email}});
            if (existingCommittee) {
                if (existingMember.email === req.body.email) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already used."
                    });
                }
            }
            const committee = await Committee.create({
                name: req.body.name,
                position: req.body.position,
                mobile: req.body.mobile,
                email: req.body.email,
                isActive: req.body.isActive,
                createdBy: req.session.user ? req.session.user.id : 0,
                createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
            });
            const committeeId = committee.id;
            const committeeInfo = await Committee.findByPk(committeeId);
            res.status(200).json({success: true, message: "Committee member added.", data: committeeInfo});
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error });
    }
}
exports.edit = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        const committeeId = helpers.decryptId(encryptedId);

        const committee = await Committee.findByPk(committeeId);
        if (!committee) {
            return res.status(404).send("User not found");
        }
        let csrfToken = req.csrfToken();
        const html = await ejs.renderFile(__dirname+"/../views/admin/committee/add_edit.ejs",{
            csrfToken,
            committee,
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
        const requiredParams = ["name","position","email","mobile"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            const committeeId = req.params.id ? await helpers.decryptId(req.params.id) : null;
            if (!committeeId) {
                return res.status(400).json({ success: false, message: "Invalid member ID" });
            }
            const existingCommittee = await Committee.findOne({
                where: {
                    id: { [Op.ne]: committeeId }, 
                    [Op.or]: [
                        { email: req.body.email }
                    ]
                }
            });
            if (existingCommittee) {
                if (existingCommittee.email === req.body.email) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already used."
                    });
                }
            }
            const updateData = {
                name: req.body.name,
                position: req.body.position,
                mobile: req.body.mobile,
                email: req.body.email,
                isActive: req.body.isActive,
                updatedBy: req.session.user ? req.session.user.id : 0,
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss") 
            };
            await Committee.update(updateData, { where: { id: committeeId } });

            const updatedCommittee = await Committee.findByPk(committeeId);
            res.status(200).json({success: true, message: "Committee member updated.", data: updatedCommittee});
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error });
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
    try {
        const whereCondition = { is_active: 'Y', member_id: 0 };
        const members = await Member.findAll({
            where: whereCondition,
            order: [['id', 'DESC']]
        });
        const templatePath = path.join(__dirname, "../views/admin/member/export.ejs"); // adjust path
        const html = await ejs.renderFile(templatePath, { members });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
            path: "output.pdf",
            format: "A3",
            printBackground: true
        });
        await browser.close();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=output.pdf",
            "Content-Length": pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating PDF");
    }
}
exports.export_excel = async (req, res) => {
    try {
        const whereCondition = { is_active: 'Y', member_id: 0 };
        const members = await Member.findAll({
            where: whereCondition,
            order: [['id', 'DESC']]
        });
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Family Members");

        worksheet.columns = [
            { header: "#", key: "s_no", width: 5 },
            { header: "Member ID", key: "member_id", width: 20 },
            { header: "Full Name", key: "fname", width: 20 },
            { header: "Email", key: "email", width: 15 },
            { header: "Mobile No", key: "mobile_no", width: 15 },
            { header: "Family Members", key: "family_member", width: 15 }
        ];

        members.forEach((member, index) => {
            worksheet.addRow({
                s_no: index + 1,
                member_id: member.id,
                fname: member.fname+" "+member.mname+" "+member.lname,
                email: member.email,
                mobile_no: member.mobile_no,
                family_member: member.family_member
            });
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=members.xlsx"
        );

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating PDF");
    }
}
exports.delete = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        const memberId = parseInt(helpers.decryptId(encryptedId));
        
        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(404).send("Member not found");
        }
        await member.update({deletedBy: req.session.user ? req.session.user.id : 0});
        await member.destroy();
        return res.status(200).json({ success: true, message: "Member deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}