const express = require('express');
const router = express.Router();
const { getAllQueues, updateQueue, deleteQueue, createQueue } = require('../../controllers/admin/QueueManagementController');

router.get('/', getAllQueues);   
router.patch('/:id', updateQueue);   
router.delete('/:id', deleteQueue);

module.exports = router;
