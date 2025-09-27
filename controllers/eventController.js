const path = require("path");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const moment = require("moment");
const puppeteer = require("puppeteer");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const csrf = require("csurf");
const Event = require("../models/Event");
const helpers = require("../helpers/customHelper");
const { Op } = require('sequelize');
const { hasPermission } = require("../helpers/permission");

exports.index = async (req, res) => {
    if (!hasPermission(req.session.user.id, "event", "list")) {
        return res.status(403).json({ success: false, message: "Permission denied" });
    }
    res.render("admin/event/list");
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
                    { date: { [Op.like]: `%${searchValue}%` } },
                    { time: { [Op.like]: `%${searchValue}%` } }
                ]
            })
        };

        const recordsTotal = await Event.count({ where: whereCondition });
        const rows = await Event.findAll({
            where: whereCondition,
            offset: start,
            limit: length,
            order: [['id', 'DESC']]
        });
        const recordsFiltered = searchValue ? rows.length : recordsTotal;

        const formattedEvent = rows.map((event, index) => {
            return {
                id: start + index + 1,
                event_name: event.name,
                event_date: helpers.format_date(event.date),
                event_day: helpers.day(event.date),
                event_time: helpers.format_time(event.date+" "+event.time),
                status: event.isActive ? '<span class="badge badge-success badge-xs d-inline-flex align-items-center">Active</span>' : '<span class="badge badge-danger badge-xs d-inline-flex align-items-center">Inactive</span>',
                actions: `
                    <div class="edit-delete-action">
                        <div class="edit-delete-action">
                            <a href="/admin/events/edit/${helpers.encryptId(event.id)}" class="me-2 edit-icon p-2 text-success" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></a>
                            <a href='javascript:;' onclick="remove_row('/admin/events/delete/${helpers.encryptId(event.id)}')" data-bs-toggle="modal" data-bs-target="#delete-modal" class="p-2" href="javascript:void(0);"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></a>
                        </div>
                    </div>
                `
            };
        });
        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data: formattedEvent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}
exports.create = async (req, res) => {
    const event = null;
    const csrfToken = req.csrfToken();
    const contact_persons = [];

    res.render("admin/event/add_edit", {
        csrfToken: req.csrfToken(),
        event,
        contact_persons,
        helpers
    });
}
exports.store = async (req, res) => {
    try {
        let requestData = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
        const requiredParams = ["name","date","time","venue"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            const contact_persons = req.body.contact_persons || "";
            const contactPersonStr = JSON.stringify(contact_persons);

            const event = await Event.create({
                name: req.body.name,
                date: req.body.date,
                time: req.body.time,
                venue: req.body.venue,
                display: req.body.display,
                description: req.body.description,
                contact_person: contactPersonStr,
                isActive: req.body.isActive,
                createdBy: req.session.user ? req.session.user.id : 0,
                createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
            });
            const eventId = event.id;
            const eventInfo = await Event.findByPk(eventId);
            res.status(200).json({success: true, message: "Event has been added.", data: eventInfo});
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error });
    }
}
exports.edit = async (req, res) => {
    try {
        const encryptedId = req.params.id;
        const eventId = helpers.decryptId(encryptedId);

        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).send("Event not found");
        }
        const contact_persons = JSON.parse(event.contact_person || []);
        res.render("admin/event/add_edit", {
            csrfToken: req.csrfToken(),
            event,
            contact_persons,
            helpers
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}
exports.update = async (req, res) => {
    try {
        let requestData = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
        const requiredParams = ["name","date","time","venue"];
        const missingParams = await helpers.ParamValidation(requiredParams,requestData);
        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                missing: missingParams
            });
        } else {
            const eventId = req.params.id ? await helpers.decryptId(req.params.id) : null;
            if (!eventId) {
                return res.status(400).json({ success: false, message: "Invalid member ID" });
            }
            const contact_persons = req.body.contact_persons || "";
            const contactPersonStr = JSON.stringify(contact_persons);

            const updateData = {
                name: req.body.name,
                date: req.body.date,
                time: req.body.time,
                venue: req.body.venue,
                display: req.body.display,
                description: req.body.description,
                contact_person: contactPersonStr,
                isActive: req.body.isActive,
                updatedBy: req.session.user ? req.session.user.id : 0,
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss") 
            };
            await Event.update(updateData, { where: { id: eventId } });

            const updatedEvent = await Event.findByPk(eventId);
            res.status(200).json({success: true, message: "Event has been updated.", data: updatedEvent});
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: error });
    }
}
exports.export = async (req, res) => {
    try {
        const rows = await Event.findAll();
        const templatePath = path.join(__dirname, "../views/admin/event/export.ejs"); // adjust path
        const html = await ejs.renderFile(templatePath, { rows,helpers });

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
            "Content-Disposition": "attachment; filename=events.pdf",
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
        const rows = await Event.findAll();
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Events");

        worksheet.columns = [
            { header: "#", key: "s_no", width: 5 },
            { header: "Event Name", key: "name", width: 20 },
            { header: "Event Date", key: "date", width: 15 },
            { header: "Event Day", key: "day", width: 15 },
            { header: "Event Time", key: "time", width: 15 },
        ];

        rows.forEach((row, index) => {
            worksheet.addRow({
                s_no: index + 1,
                name: row.name,
                date: helpers.format_date(row.date),
                day: helpers.day(row.date),
                time: helpers.format_time(row.date+" "+row.time)
            });
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=events.xlsx"
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
        const committeeId = parseInt(helpers.decryptId(encryptedId));
        
        const event = await Event.findByPk(committeeId);
        if (!event) {
            return res.status(404).send("Event not found");
        }
        await event.update({deletedBy: req.session.user ? req.session.user.id : 0});
        await event.destroy();
        return res.status(200).json({ success: true, message: "Event has been deleted." });
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
}