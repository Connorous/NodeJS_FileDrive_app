const passport = require("../appPassport");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display user login form on GET.
exports.login_get = asyncHandler(async (req, res, next) => {
  res.render("user_form", {
    title: "Log In",
    errors: false,
    message: null,
  });
});

// Display user create form on GET.
exports.register_get = asyncHandler(async (req, res, next) => {
  res.render("user_form", { title: "Register", errors: false, message: null });
});

// Handle user create on POST.
exports.register_post = [
  // Validate and sanitize fields.
  body("email", "Email must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("password", "password must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("confirmpassword", "confirm password must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("confirmpassword", "Both passwords must match").custom(
    (value, { req }) => {
      return value === req.body.password;
    }
  ),

  // Process request after validation and sanitization.

  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      res.render("user_form", {
        title: "Register",
        errors: errors.array(),
        message: null,
      });
    } else {
      // Data from form is valid.
      // Check if User with same email or displayname already exists.
      const emailExists = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
        select: {
          email: true,
        },
      });
      if (emailExists) {
        // User exists, redisplay form
        res.render("user_form", {
          title: "Register",
          message: "User with the email provided already exists",
          errors: false,
        });
      } else {
        // Create a User object with escaped and trimmed data. Encrypting the user's password
        try {
          var password = req.body.password;
          bcrypt.hash(password, 10, async (err, hashedPassword) => {
            // if err, do something
            // otherwise, store hashedPassword in DB

            const user = await prisma.user.create({
              data: {
                email: req.body.email,
                password: hashedPassword,
              },
            });

            res.redirect("/");
          });
        } catch (err) {
          console.log(err);
          return next(err);
        }
      }
    }
  }),
];
