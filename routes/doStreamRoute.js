const express = require("express");
const router = express.Router();
const doStream = require("../controllers/doStreamController");

router.get("/do-stream", doStream);

module.exports = router;