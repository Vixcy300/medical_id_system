require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const User = require('./models/User');
const Patient = require('./models/Patient');
const AccessLog = require('./models/AccessLog');

const app = express();
const PORT = process.env.PORT || 5000;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency_medical_id';
const JWT_SECRET = process.env.JWT_SECRET || 'simple_secret_2025';
const DOCTOR_SECRET_CODE = process.env.DOCTOR_SECRET_CODE || 'DOC_2025';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Error:', error.message);
  }
}
connectToDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, secretCode } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    if (role === 'doctor' && secretCode !== DOCTOR_SECRET_CODE) return res.status(403).json({ success: false, message: 'Invalid doctor code' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ email, password: hashedPassword, role: role || 'patient' });
    await user.save();
    console.log('User registered:', email);
    res.status(201).json({ success: true, message: 'Account created' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Register failed: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Invalid password' });
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    console.log('User logged in:', email);
    res.json({ success: true, token, user: { email, role: user.role } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed: ' + error.message });
  }
});

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.authorization;
    if (!token) return res.status(401).json({ success: false, message: 'Token required' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

app.get('/api/patient/profile', authMiddleware, async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });
    res.json({ success: true, patient: patient || null });
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ success: false, message: 'Profile fetch failed' });
  }
});

app.post('/api/patient/profile', authMiddleware, async (req, res) => {
  try {
    const { personalInfo, medicalInfo, emergencyContact } = req.body;
    let patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) patient = new Patient({ userId: req.user.userId, patientId: `EMG-${Date.now()}` });
    patient.personalInfo = personalInfo || {};
    patient.medicalInfo = medicalInfo || {};
    patient.emergencyContact = emergencyContact || {};
    patient.qrCodeImage = await QRCode.toDataURL(JSON.stringify({ patientId: patient.patientId }));
    await patient.save();
    res.json({ success: true, message: 'Profile saved', patient });
  } catch (error) {
    console.error('Profile Save Error:', error);
    res.status(500).json({ success: false, message: 'Save failed' });
  }
});

app.get('/api/doctor/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    const accessLog = new AccessLog({ patientId: req.params.patientId, accessedBy: req.user.userId });
    await accessLog.save();
    res.json({ success: true, patient });
  } catch (error) {
    console.error('Doctor Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
});

module.exports = app;