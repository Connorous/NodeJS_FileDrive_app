const passport = require("../appPassport");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.home = asyncHandler(async (req, res, next) => {
  res.render("index", { title: "Home", user: res.locals.currentUser });
});

// Display list of all of there user's folders.
exports.list_folders = asyncHandler(async (req, res, next) => {
  const allFolders = await prisma.folder.findMany({
    where: {
      ownerId: res.locals.currentUser.id,
    },
    select: {
      id: true,
      name: true,
      dateCreated: true,
      ownerId: true,
    },
  });
  res.render("index", {
    title: "File Drive",
    list_folders: allFolders,
    user: res.locals.currentUser,
  });
});

// Display folder create form on GET.
exports.folder_create_get = asyncHandler(async (req, res, next) => {
  res.render("folder_form", {
    title: "Create Folder",
    errors: false,
    message: null,
  });
});

// Handle folder create on POST.
exports.folder_create_post = [
  // Validate and sanitize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.

  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      res.render("folder_form", {
        title: "Create Folder",
        errors: errors.array(),
        message: null,
      });
    } else {
      const user = res.locals.currentUser;
      // Data from form is valid.
      // Check if Folder with same name and user already exists.
      const folderExists = await prisma.folder.findFirst({
        where: {
          name: req.body.name,
          ownerId: user.id,
        },
        select: {
          name: true,
        },
      });
      if (folderExists) {
        // Folder exists, redisplay form
        res.render("folder_form", {
          title: "Create Folder",
          message: "Folder with the name provided already exists",
        });
      } else {
        // Create a Folder object with escaped and trimmed data
        const newFolder = await prisma.folder.create({
          data: {
            name: req.body.name,
            ownerId: user.id,
          },
        });

        res.redirect("/");
      }
    }
  }),
];

// Display folder and files on GET
exports.folder_get_get = asyncHandler(async (req, res, next) => {
  // Get user
  const user = res.locals.currentUser;
  const folder = await prisma.folder.findFirst({
    where: {
      id: Number(req.params.id),
      ownerId: user.id,
    },
    select: {
      id: true,
      name: true,
      dateCreated: true,
    },
  });

  if (!folder) {
    // No results.
    const err = new Error("Folder not found");
    err.status = 404;
    return next(err);
  }

  const files = await prisma.file.findMany({
    where: {
      folderId: folder.id,
    },
    select: {
      name: true,
      dateUploaded: true,
      id: true,
    },
  });
  if (files) {
    if (files.length > 0) {
      res.render("folder_contents", {
        title: "Folder",
        user: user,
        folder: folder,
        errors: false,
        message: null,
        files: files,
      });
    } else {
      res.render("folder_contents", {
        title: "Folder",
        user: user,
        folder: folder,
        errors: false,
        message: null,
        files: null,
      });
    }
  } else {
    res.render("folder_contents", {
      title: "Folder",
      user: user,
      folder: folder,
      errors: false,
      message: null,
      files: null,
    });
  }
});

// Display folder delete form on GET.
exports.folder_delete_get = asyncHandler(async (req, res, next) => {
  // Get user
  const user = res.locals.currentUser;
  const folder = await prisma.folder.findFirst({
    where: {
      id: Number(req.params.id),
      ownerId: user.id,
    },
    select: {
      id: true,
      name: true,
      dateCreated: true,
    },
  });

  if (!folder) {
    // No results.
    const err = new Error("Folder not found");
    err.status = 404;
    return next(err);
  }

  const files = await prisma.file.findMany({
    where: {
      folderId: folder.id,
    },
    select: {
      name: true,
      dateUploaded: true,
    },
  });

  if (files) {
    if (files.length > 0) {
      res.render("folder_delete", {
        title: "Delete Folder",
        user: user,
        folder: folder,
        errors: false,
        message: null,
        files: files,
      });
    } else {
      res.render("folder_delete", {
        title: "Delete Folder",
        user: user,
        folder: folder,
        errors: false,
        message: null,
        files: null,
      });
    }
  } else {
    res.render("folder_delete", {
      title: "Delete Folder",
      user: user,
      folder: folder,
      errors: false,
      message: null,
      files: null,
    });
  }
});

// Handle folder delete on POST.
exports.folder_delete_post = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;
  //get the folder
  const folder = await prisma.folder.findFirst({
    where: {
      id: Number(req.params.id),
      ownerId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!folder) {
    // No results.
    const err = new Error("Folder not found");
    err.status = 404;
    return next(err);
  }

  //delete files in folder from database
  const deleteFiles = await prisma.file.deleteMany({
    where: {
      folderId: folder.id,
    },
  });

  //delete folder from database
  const deleteFolder = await prisma.folder.delete({
    where: {
      id: folder.id,
      ownerId: user.id,
    },
  });
  res.redirect("/");
});

exports.upload_file_get = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;
  const folder = await prisma.folder.findFirst({
    where: {
      id: Number(req.params.id),
      ownerId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!folder) {
    // No results.
    const err = new Error("Folder not found");
    err.status = 404;
    return next(err);
  }
  res.render("upload_file", {
    title: "Upload File",
    user: user,
    folder: folder,
    errors: false,
    message: null,
  });
});

exports.upload_file_post = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;
  const folder = await prisma.folder.findFirst({
    where: {
      id: Number(req.params.id),
      ownerId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!folder) {
    // No results.
    const err = new Error("Folder not found");
    err.status = 404;
    return next(err);
  }
  const newFile = await prisma.file.create({
    data: {
      name: req.file.originalname,
      file: req.file.buffer,
      folderId: folder.id,
    },
  });
  res.redirect("/get-folder/" + folder.id);
});

exports.download_file_get = asyncHandler(async (req, res, next) => {
  const fileEntry = await prisma.file.findFirst({
    where: {
      id: Number(req.params.id),
    },
    select: {
      id: true,
      name: true,
      file: true,
      folderId: true,
    },
  });
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + fileEntry.name
  );
  res.send(fileEntry.file);
});

exports.file_delete_get = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;
  const file = await prisma.file.findFirst({
    where: {
      id: Number(req.params.id),
    },
    select: {
      id: true,
      name: true,
      dateUploaded: true,
    },
  });
  if (!file) {
    // No results.
    const err = new Error("File could not be found");
    err.status = 404;
    return next(err);
  }
  const folder = await prisma.folder.findFirst({
    where: {
      id: file.folderId,
      ownerId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });
  if (!folder) {
    // No results.
    const err = new Error("Folder for file not found");
    err.status = 404;
    return next(err);
  }
  res.render("file_delete", {
    title: "Delete File",
    user: user,
    folder: folder,
    file: file,
    errors: false,
    message: null,
  });
});

exports.file_delete_post = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;
  const file = await prisma.file.findFirst({
    where: {
      id: Number(req.params.id),
    },
    select: {
      id: true,
      name: true,
      dateUploaded: true,
    },
  });
  if (!file) {
    // No results.
    const err = new Error("File could not be found");
    err.status = 404;
    return next(err);
  }
  const folder = await prisma.folder.findFirst({
    where: {
      id: file.folderId,
      ownerId: user.id,
    },
    select: {
      id: true,
    },
  });
  if (!folder) {
    // No results.
    const err = new Error("Folder for file not found");
    err.status = 404;
    return next(err);
  }
  const deleteFile = await prisma.file.delete({
    where: {
      id: file.id,
    },
  });
  res.redirect("/get-folder/" + folder.id);
});
