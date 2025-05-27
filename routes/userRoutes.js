const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Wrapped verilerini dönen endpoint
router.get("/wrapped/:userId", userController.getWrappedData);

module.exports = router;
