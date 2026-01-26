const express = require('express');
const router = express.Router();
const {
  getAllQueues,
  updateQueue,
  deleteQueue,
  createQueue
} = require('../../controllers/admin/QueueManagementController');

const { authenticateUser } = require('../../middlewares/authorizedUsers');
const adminOnly = require('../../middlewares/rolemiddleware')('admin');

router.use(authenticateUser, adminOnly);

router.get('/', getAllQueues);

router.patch('/:id', updateQueue);

router.delete('/:id', deleteQueue);


module.exports = router;
