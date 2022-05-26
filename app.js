const express = require("express");
const multer = require("multer");
const djs = require("dayjs");

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
const port = 5000;
const uploadsDirectory = path.join(__dirname, "uploads");

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Directory to store all uploads
  },
  filename: (req, file, cb) => {
    // File name to be stored: <fileName>-<timestamp>
    let fileName = path.parse(file.originalname)
    cb(null, fileName.name + "-" + djs().format("DDMMYYHHmmss") + fileName.ext);
  },
});

const maxSize = 1 * 1000 * 1000; // 1 MB

let upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
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
  fs.readdir(uploadsDirectory, (err, files) => {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    res.render("index", { files });
  });

});

app.post("/upload/", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.send(err);
    }
    res.render("success", { file: req.file.filename });
  });
});

app.get("/run/:fileName", (req, res) => {
  const { base: fileName, ext: extName } = path.parse(req.params.fileName)
  // console.log(fileName, extName)
  fs.exists(`uploads/${fileName}`, (isExists) => {
    if(isExists && extName.toLowerCase() == '.py') {
      let dataToSend;
      const python = spawn('python', [`uploads/${fileName}`]);
      python.stdout.on('data', function (data) {
        dataToSend = data.toString();
      });
      python.on('close', (code) => {
        res.write(dataToSend);
        res.end();
      });
    } 
    else {
      res.status(404).send("File does not exists or is not a python script!");
    }
  })
});

app.listen(port, () => console.log(`App listening on port ${port}!`));