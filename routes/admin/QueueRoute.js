const express = require('express');
const router = express.Router();
const queueController = require('../../controllers/admin/QueueManagementController');

router.get('/', queueController.getQueue);
router.post('/', queueController.enqueue);
router.put('/:id', queueController.updateQueueStatus);
router.delete('/:id', queueController.dequeue);

module.exports = router;
