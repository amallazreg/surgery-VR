const express = require('express');
const router = express.Router();
const upload = require('../middlewares/cloudinary');
const {signup,signin, updateProfile, changePassword} = require('../controllers/authController');

const { protect } = require('../middlewares/auth'); 


router.post(
  '/signup',
    upload.single('documentVerification'),
  signup
);

router.post('/login', signin);

router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);


module.exports = router;
