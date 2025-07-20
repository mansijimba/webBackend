const express = require('express');
const router = express.Router();
const Queue = require('../models/admin/Queue'); // Adjust path if needed

router.get('/', async (req, res) => {
  const { patientId, appointmentId } = req.query;

  if (!patientId && !appointmentId) {
    return res.status(400).json({ message: 'Please provide patientId or appointmentId' });
  }

  try {
    let queueItem;

    if (appointmentId) {
      queueItem = await Queue.findOne({ appointment: appointmentId });
    } else {
      queueItem = await Queue.findOne({ patient: patientId, status: { $in: ['Waiting', 'In Progress'] } });
    }

    if (!queueItem) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    // Calculate number of patients ahead in the queue based on queuePosition and same doctor
    const totalAhead = await Queue.countDocuments({
      doctor: queueItem.doctor,
      status: 'Waiting',
      queuePosition: { $lt: queueItem.queuePosition },
    });

    // Parse waitTime string like "15 min" to number if needed (optional)
    let estimatedWait = 0;
    if (queueItem.waitTime) {
      const matches = queueItem.waitTime.match(/(\d+)/);
      estimatedWait = matches ? parseInt(matches[1], 10) : 0;
    }

    res.json({
      success: true,
      status: queueItem.status,
      position: queueItem.queuePosition,
      totalAhead,
      estimatedWait,
    });
  } catch (err) {
    console.error('Error fetching queue status:', err);
    res.status(500).json({ message: 'Failed to fetch queue status' });
  }
});

module.exports = router;
