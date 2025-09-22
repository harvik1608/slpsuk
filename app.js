const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const app = express();
const port = 3000;

// storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // folder to save images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.none());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: "20dead51b20559cdc89df6b7eeb58fe3",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // true if using HTTPS
}));
const adminAuthRoutes = require("./routes/backendRoutes");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use("/admin", adminAuthRoutes);

app.listen(port, () => {
	console.log(`🚀 Server running at http://localhost:${port}`);
});