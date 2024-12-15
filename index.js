const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const compression = require("compression");
const axios = require("axios");

const app = express();

// Menggunakan MemoryStore untuk menyimpan sesi
const sessionMiddleware = session({
  secret: "your_secret_key", // Ganti dengan kunci yang lebih aman
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Gunakan HTTPS di production
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // Durasi sesi (1 jam)
  },
});

app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

// Dashboard login handler
app.all("/player/login/dashboard", function (req, res) {
  const tData = {};
  try {
    const uData = JSON.stringify(req.body).split('"')[1].split("\\n");
    const uName = uData[0].split("|");
    const uPass = uData[1].split("|");
    for (let i = 0; i < uData.length - 1; i++) {
      const d = uData[i].split("|");
      tData[d[0]] = d[1];
    }
    if (uName[1] && uPass[1]) {
      res.redirect("/player/growid/login/validate");
    }
  } catch (why) {
    console.log(`Warning: ${why}`);
  }

  res.render(__dirname + "/public/html/dashboard.ejs", { data: tData });
});

// Token validation handler
app.all("/player/growid/login/validate", async (req, res) => {
  try {
    const { growId, password } = req.body;

    if (!growId || !password) {
      return res.status(400).send({
        status: "error",
        message: "growId and password are required.",
      });
    }
    // Generate token (Base64 encoding)
    const token = Buffer.from(
      `&growId=${growId}&password=${password}`
    ).toString("base64");
    // Save token in session
    req.session.token = token;

    res.send({
      status: "success",
      message: "Account Validated.",
      token,
      accountType: "growtopia",
    });
  } catch (error) {
    console.error("Error in token validation:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Check token handler
app.all("/player/growid/checktoken", async (req, res) => {
  try {
    if (!req.session.token) {
      return res.status(401).send({
        status: "error",
        message: "Unauthorized. Token not found.",
      });
    }
    res.send({
      status: "success",
      message: "Token validated successfully.",
      token: req.session.token,
    });
  } catch (error) {
    console.error("Error in checking token:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
