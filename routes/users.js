var express = require("express");
var router = express.Router();

const user_controller = require("../controllers/usercontroller");

var authorizor = require("./authMiddleware");

router.get("/login", user_controller.login_get);

router.get("/register", user_controller.register_get);

router.post("/register", user_controller.register_post);

module.exports = router;
