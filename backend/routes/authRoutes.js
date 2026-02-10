const express = require('express');
const router = express.Router();
const upload = require('../middlewares/cloudinary');
const {signup,signin} = require('../controllers/authController');

router.post(
  '/signup',
    upload.single('documentVerification'),
  signup
);

router.post('/login', signin);


module.exports = router;
