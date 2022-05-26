const express = require("express");
const multer = require("multer");
const djs = require("dayjs");

const path = require("path");
const fs = require("fs");
// const { spawn } = require("child_process");

const app = express();
const port = 5000;
const uploadsDirectory = path.join(__dirname, "uploads");

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Directory to store all uploads
  },
  filename: function (req, file, cb) {
    // File name to be stored: <fileName>-<timestamp>
    let fileName = path.parse(file.originalname)
    cb(null, fileName.name + "-" + djs().format("DDMMYYHHmmss") + fileName.ext);
  },
});

const maxSize = 1 * 1000 * 1000; // 1 MB

let upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    let filetypes = /py/;
    let mimetype = filetypes.test(file.mimetype);
    console.log(file.mimetype);
    let extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(`Error: File upload only supports the following filetypes - ${filetypes}`);
  },
}).single("fileName");

app.set("view engine", "ejs");
app.set("views", "views");

app.get("/", (req, res) => {
  fs.readdir(uploadsDirectory, function (err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }

    res.render("index", { files });
  });

});

app.post("/upload/", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      res.send(err);
    }

    res.render("success", { file: req.file.filename });
  });
});

app.get("/run/:file", (req, res) => {
  res.send("File successfully run");
});

app.listen(port, () => console.log(`App listening on port ${port}!`));