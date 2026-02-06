const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const {inscription} = require('../controllers/authController');

router.post(
  '/inscription',
  upload.single('documentVerification'),
  inscription
);

module.exports = router;
