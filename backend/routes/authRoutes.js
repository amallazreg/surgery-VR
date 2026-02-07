const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const {inscription,login} = require('../controllers/authController');

router.post(
  '/inscription',
  upload.single('documentVerification'),
  inscription
);

router.post('/login', login);


module.exports = router;
