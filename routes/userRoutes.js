const express = require('express');

const {
  getAllUsers,
  addUsers,
  getUser,
  updateUsers,
  deleteUsers,
  updateMe,
  deleteMe,
  addIdToParams,
  getMe,
} = require('../controllers/usersController');

const authController = require('../controllers/authController');

const router = express.Router();


router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);

router.post('/forgetpassword', authController.forgetPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

router.use(authController.protect)

router.patch(
  '/updatepassword',
  authController.updatePassword
  );
  router.get('/me', addIdToParams, getMe)
  router.patch('/updateme',  updateMe);
  router.delete('/deleteme', deleteMe);
  
  
  router.use(authController.restrictTo('admin', 'guide'))

router.route('/')
  .get(getAllUsers)
  .post(addUsers);
router.route('/:id')
  .get(getUser)
  .patch(updateUsers)
  .delete(deleteUsers);

module.exports = router;
