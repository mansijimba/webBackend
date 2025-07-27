const Queue = require('../../models/admin/Queue');
const Appointment = require('../../models/admin/Appointment');

exports.getAllQueues = async (req, res) => {
  try {
    const queues = await Queue.find()
      .populate('appointment')
      .populate('patient', 'fullName')
      .populate('doctor', 'name specialty')
      .sort({ queuePosition: 1 });

    res.status(200).json({
      success: true,
      data: queues,
    });
  } catch (err) {
    console.error('Error fetching queues:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.updateQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedQueue = await Queue.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedQueue) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Queue updated successfully',
      data: updatedQueue,
    });
  } catch (err) {
    console.error('Error updating queue:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedQueue = await Queue.findByIdAndDelete(id);

    if (!deletedQueue) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Queue entry deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting queue:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 
