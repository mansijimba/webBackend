const Queue = require('../../models/admin/Queue');

exports.getQueue = async (req, res) => {
  const queue = await Queue.find().populate('appointment');
  res.json(queue);
};

exports.enqueue = async (req, res) => {
  const queueItem = new Queue(req.body);
  await queueItem.save();
  res.status(201).json(queueItem);
};

exports.updateQueueStatus = async (req, res) => {
  const updated = await Queue.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(updated);
};

exports.dequeue = async (req, res) => {
  await Queue.findByIdAndDelete(req.params.id);
  res.json({ message: 'Queue item removed' });
};
