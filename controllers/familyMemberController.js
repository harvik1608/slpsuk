const path = require("path");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const moment = require("moment");
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const Member = require("../models/Member");
const helpers = require("../helpers/customHelper");
const { Op } = require('sequelize');
const { hasPermission } = require("../helpers/permission");

exports.index = async (req, res) => {
    if (!hasPermission(req.session.user.id, "family_member", "list")) {
        return res.status(403).json({ success: false, message: "Permission denied" });
    }
    res.render("admin/family_member/list");
}
exports.load = async (req, res) => {
    try {
        const draw = parseInt(req.query.draw) || 0;
        const start = parseInt(req.query.start) || 0;
        const length = parseInt(req.query.length) || 10;
        const searchValue = req.query['search[value]'] || '';

        const whereCondition = {
            member_id: { [Op.gt]: 0 },
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
            include: [
                {
                    model: Member,
                    as: "parent", 
                    attributes: ["id", "fname", "mname", "lname"]
                }
            ],
            offset: start,
            limit: length,
            order: [['id', 'DESC']]
        });
        const recordsFiltered = searchValue ? users.length : recordsTotal;

        const formattedUsers = users.map((user, index) => {
            const parentName = user.parent ? `${user.parent.fname} ${user.parent.lname}` : "N/A";

            return {
                id: start + index + 1,
                member_id: user.id,
                name: user.fname+' '+user.mname+' '+user.lname,
                parent_name: parentName,
                relation: user.relation,
                actions: `
                    <div class="edit-delete-action">
                        <div class="edit-delete-action">
                            <a href='javascript:;' onclick="remove_row('/admin/family-members/delete/${helpers.encryptId(user.id)}')" data-bs-toggle="modal" data-bs-target="#delete-modal" class="p-2" href="javascript:void(0);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></a>
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
exports.export = async (req, res) => {
    try {
        const whereCondition = { member_id: { [Op.gt]: 0 } };
        const members = await Member.findAll({
            where: whereCondition,
            include: [
                {
                    model: Member,
                    as: "parent", 
                    attributes: ["id", "fname", "mname", "lname"]
                }
            ],
            order: [['id', 'DESC']]
        });
        const templatePath = path.join(__dirname, "../views/admin/family_member/export.ejs"); // adjust path
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
            "Content-Disposition": "attachment; filename=family_member.pdf",
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
        const whereCondition = { member_id: { [Op.gt]: 0 } };
        const members = await Member.findAll({
            where: whereCondition,
            include: [
                {
                    model: Member,
                    as: "parent", 
                    attributes: ["id", "fname", "mname", "lname"]
                }
            ],
            order: [['id', 'DESC']]
        });
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Family Members");

        worksheet.columns = [
            { header: "#", key: "s_no", width: 5 },
            { header: "Member ID", key: "member_id", width: 20 },
            { header: "Family Member Name", key: "family_member_name", width: 20 },
            { header: "Main Member Name", key: "main_member_name", width: 15 },
            { header: "Relation", key: "relation", width: 15 },
            { header: "Email", key: "email", width: 15 }
        ];

        members.forEach((member, index) => {
            const parentName = member.parent ? `${member.parent.fname} ${member.parent.lname}` : "N/A";

            worksheet.addRow({
                s_no: index + 1,
                member_id: member.id,
                family_member_name: member.fname+" "+member.mname+" "+member.lname,
                main_member_name: parentName,
                relation: member.relation,
                email: member.email
            });
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=family_members.xlsx"
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
            return res.status(404).send("Family Member not found");
        }
        await member.update({deletedBy: req.session.user ? req.session.user.id : 0});
        await member.destroy();
        return res.status(200).json({ success: true, message: "Family Member has been deleted." });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}