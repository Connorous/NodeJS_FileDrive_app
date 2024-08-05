var express = require("express");
var router = express.Router();
const multer = require("multer");
const upload = multer();

const folder_controller = require("../controllers/foldercontroller");

var authorizor = require("./authMiddleware");

router.get("/", authorizor.isLoggedIn, folder_controller.list_folders);

router.get(
  "/create-folder",
  authorizor.isLoggedIn,
  folder_controller.folder_create_get
);

router.post(
  "/create-folder",
  authorizor.isLoggedIn,
  folder_controller.folder_create_post
);

router.get(
  "/get-folder/:id",
  authorizor.isLoggedIn,
  folder_controller.folder_get_get
);

router.get(
  "/delete-folder/:id",
  authorizor.isLoggedIn,
  folder_controller.folder_delete_get
);

router.post(
  "/delete-folder/:id",
  authorizor.isLoggedIn,
  folder_controller.folder_delete_post
);

router.get(
  "/upload-file/:id",
  authorizor.isLoggedIn,
  folder_controller.upload_file_get
);

router.post(
  "/upload-file/:id",
  authorizor.isLoggedIn,
  upload.single("uploaded_file"),
  folder_controller.upload_file_post
);

router.get(
  "/download-file/:id",
  authorizor.isLoggedIn,
  folder_controller.download_file_get
);

router.get(
  "/delete-file/:id",
  authorizor.isLoggedIn,
  folder_controller.file_delete_get
);

router.post(
  "/delete-file/:id",
  authorizor.isLoggedIn,
  folder_controller.file_delete_post
);

module.exports = router;
