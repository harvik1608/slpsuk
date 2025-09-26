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
                            <a href="/admin/members/edit/${helpers.encryptId(user.id)}" class="me-2 edit-icon p-2 text-success" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></a>
                             <a href='javascript:;' onclick="remove_row('/admin/members/delete/${helpers.encryptId(user.id)}')" data-bs-toggle="modal" data-bs-target="#delete-modal" class="p-2" href="javascript:void(0);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></a>
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
exports.create = async (req, res) => {
    const member = null;
    const family_members = [];
    let csrfToken = req.csrfToken();
    const html = await ejs.renderFile(__dirname+"/../views/admin/member/add_edit.ejs",{
        csrfToken:csrfToken,
        member,
        family_members,
        helpers
    });
    res.render("include/header",{
        body: html
    });
}
exports.store = async (req, res) => {
    try {
        let requestData = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
        const requiredParams = ["fname","lname","dob","email","password","confirm_password"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            if(req.body.password != req.body.confirm_password) {
                return res.status(400).json({
                    success: false,
                    message: "Password & Confirm Password must be same."
                });
            }
            const existingMember = await Member.findOne({where: {email:  req.body.email}});
            if (existingMember) {
                if (existingMember.email === req.body.email) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already used."
                    });
                }
            }
            const hashedPassword = crypto.createHash("md5").update(req.body.password).digest("hex");
            const member = await Member.create({
                fname: req.body.fname,
                mname: req.body.mname,
                lname: req.body.lname,
                dob: req.body.dob,
                mobile_no: req.body.mobile_no,
                home_no: req.body.home_no,
                native_place: req.body.native_place,
                real_surname: req.body.real_surname,
                postal_code: req.body.postal_code,
                address: req.body.address,
                is_marketing: req.body.is_marketing,
                is_newsletter: req.body.is_newsletter,
                email: req.body.email,
                password: hashedPassword,
                is_active: "Y",
                createdBy: req.session.user ? req.session.user.id : 0,
                createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
            });
            const memberId = member.id;
            if(req.body.family_member_fname.length > 0) {
                const family_members = [];
                for (let i = 0; i < req.body.family_member_fname.length; i++) {
                    family_members.push({
                        member_id: memberId,
                        fname: req.body.family_member_fname[i],
                        mname: req.body.family_member_mname[i],
                        lname: req.body.family_member_lname[i],
                        dob: req.body.family_member_dob[i],
                        mobile_no: req.body.family_member_mobile_no[i],
                        home_no: req.body.family_member_home_no[i],
                        email: req.body.family_member_email[i],
                        postal_code: req.body.family_member_postal_code[i],
                        relation: req.body.family_member_relation[i],
                        address: req.body.family_member_address[i],
                        is_marketing: req.body.family_member_is_marketing[i],
                        is_newsletter: req.body.family_member_is_newsletter[i],
                        createdBy: req.session.user ? req.session.user.id : 0,
                        createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
                    });
                }
                await Member.bulkCreate(family_members);
                const member = await Member.findByPk(memberId);
                await member.update({family_member: family_members.length});
            }
            res.status(200).json({success: true, message: "Member created successfully.", data: member});
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error });
    }
}
exports.edit = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        const memberId = helpers.decryptId(encryptedId);

        const member = await Member.findByPk(memberId);
        if (!member) {
            return res.status(404).send("User not found");
        }
        const family_members = await Member.findAll({
            where: {member_id: memberId}
        });
        let csrfToken = req.csrfToken();
        const html = await ejs.renderFile(__dirname+"/../views/admin/member/add_edit.ejs",{
            csrfToken,
            member,
            family_members,
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
        const requiredParams = ["fname","lname","dob","email"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            const memberId = req.params.id ? await helpers.decryptId(req.params.id) : null;
            if (!memberId) {
                return res.status(400).json({ success: false, message: "Invalid member ID" });
            }
            const existingMember = await Member.findOne({
                where: {
                    id: { [Op.ne]: memberId }, 
                    [Op.or]: [
                        { email: req.body.email }
                    ]
                }
            });
            if (existingMember) {
                if (existingMember.email === req.body.email) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already used."
                    });
                }
            }
            const updateData = {
                fname: req.body.fname,
                mname: req.body.mname,
                lname: req.body.lname,
                dob: req.body.dob,
                mobile_no: req.body.mobile_no,
                home_no: req.body.home_no,
                native_place: req.body.native_place,
                real_surname: req.body.real_surname,
                postal_code: req.body.postal_code,
                address: req.body.address,
                is_marketing: req.body.is_marketing,
                is_newsletter: req.body.is_newsletter,
                email: req.body.email,
                updatedBy: req.session.user ? req.session.user.id : 0,
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss") 
            };
            if (req.body.password && req.body.password.trim() !== '') {
                if(req.body.password != req.body.confirm_password) {
                    return res.status(400).json({
                        success: false,
                        message: "Password & Confirm Password must be same."
                    });
                }
                const hashedPassword = crypto.createHash("md5").update(req.body.password).digest("hex");
                updateData.password = hashedPassword;
            }
            await Member.update(updateData, { where: { id: memberId } });

            // Family Members
            const inputMembers = req.body.family_members;
            const existingMembers = await Member.findAll({ where: { member_id: memberId } });
            const existingIds = existingMembers.map(m => m.id);

            const toUpdate = [];
            const toInsert = [];

            if(inputMembers && inputMembers.length > 0) {
                for (let i = 0; i < inputMembers.length; i++) {
                    const fm = inputMembers[i];
                    if (fm && fm.id && existingIds.includes(parseInt(fm.id))) {
                        // Existing → update
                        toUpdate.push({
                            id: fm.id,
                            fname: fm.fname,
                            mname: fm.mname,
                            lname: fm.lname,
                            dob: fm.dob,
                            mobile_no: fm.mobile_no,
                            home_no: fm.home_no,
                            email: fm.email,
                            postal_code: fm.postal_code,
                            relation: fm.relation,
                            address: fm.address,
                            is_marketing: fm.is_marketing,
                            is_newsletter: fm.is_newsletter,
                            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss")
                        });
                    } else {
                        // New → insert
                        toInsert.push({
                            member_id: memberId,
                            fname: fm.fname,
                            mname: fm.mname,
                            lname: fm.lname,
                            dob: fm.dob,
                            mobile_no: fm.mobile_no,
                            home_no: fm.home_no,
                            email: fm.email,
                            postal_code: fm.postal_code,
                            relation: fm.relation,
                            address: fm.address,
                            is_marketing: fm.is_marketing,
                            is_newsletter: fm.is_newsletter,
                            createdBy: req.session.user ? req.session.user.id : 0,
                            createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
                        });
                    }
                }

                for (const u of toUpdate) {
                    await Member.update(u, { where: { id: u.id } });
                }

                if (toInsert.length > 0) {
                    await Member.bulkCreate(toInsert);
                }
            }
            
            let idsToDelete = req.body.deleted_ids;
            if (idsToDelete && idsToDelete.trim() !== "") {
                idsToDelete = idsToDelete.split(",").map(id => parseInt(id));

                if (idsToDelete.length > 0) {
                    await Member.destroy({
                        where: { id: idsToDelete }
                    });
                }
            }

            const remainingFamilyMembersCount = await Member.count({
                where: { member_id: memberId }  // or whatever column links to the main member
            });
            const member = await Member.findByPk(memberId);
            await member.update({ family_member: remainingFamilyMembersCount });

            const updatedMember = await Member.findByPk(memberId);
            res.status(200).json({success: true, message: "Member updated successfully.", data: updatedMember});
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