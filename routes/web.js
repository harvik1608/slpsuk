const express = require("express");
const axios = require("axios");
const ejs = require("ejs");
const router = express.Router();
const CONSTANT = require("../config/constants");
const qs = require("qs");

router.get("/", async (req, res) => {
	res.json(CONSTANT.APP_NAME);
	// try {
	// 	const response = await axios.post(CONSTANT.API_BASE_URL+"api/company",qs.stringify({
	// 		key: CONSTANT.APP_KEY,
	// 		tag: "company",
	// 		company_id: CONSTANT.COMPANY_ID,
	// 		columns: "",
	// 	}),
	// 	{
	// 		headers: {
	// 			 "Content-Type": "application/x-www-form-urlencoded"
	// 		}
	// 	})
	// 	const html = await ejs.renderFile(__dirname+"/../views/index.ejs",{salon: response.data});
	// 	res.render("layout",{
	// 		body: html,
	// 		company: response.data
	// 	});
	// } catch (error) {
	// 	if (error.response) {
	// 		console.error("Server responded with:", error.response.status, error.response.data);
	// 	} else if (error.request) {
	// 		console.error("No response received:", error.request);
	// 	} else {
	// 		console.error("Error setting up request:", error.message);
	// 	}
	// }
});
module.exports = router;