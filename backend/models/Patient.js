const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  patientId: { type: String, unique: true, required: true }, // This is the shareable ID
  personalInfo: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    bloodType: String
  },
  medicalInfo: {
    allergies: [String],
    conditions: [String],
    medications: [String]
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  qrCodeImage: String,
  isProfileFinalized: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
