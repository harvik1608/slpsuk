const express = require("express");
const session = require("express-session");
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");
const helpers = require("./helpers/permission");

const app = express();
const port = 3000;

app.use(cookieParser());

app.use(session({
    secret: '$2b$12$jjObUZJZeNSumALmdjPrMet.9DfrHUlJU4zhZchL8GNYidDEQ483q',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, "uploads/"),
//     filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
// });
// const upload = multer({ storage });
// app.use(upload.none());

const csrfProtection = csrf({ cookie: false });
app.use(csrfProtection);

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
    res.locals.hasPermission = helpers.hasPermission;
    res.locals.currentUser = req.session.user; // optional: pass user too
    next();
});

const adminAuthRoutes = require("./routes/backendRoutes");
app.use("/admin", adminAuthRoutes);

app.use((req, res, next) => {
    console.log("Session check:", req.session);
    next();
});

app.listen(port, () => {
	console.log(`🚀 Server running at http://localhost:${port}`);
});