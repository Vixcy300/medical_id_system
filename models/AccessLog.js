const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  accessedBy: { type: String, required: true },
  accessTime: { type: Date, default: Date.now },
  location: String,
  purpose: String,
  ipAddress: String
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
