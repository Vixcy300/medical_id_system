require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Import Models
const User = require('./models/User');
const Patient = require('./models/Patient');
const AccessLog = require('./models/AccessLog');

const app = express();
const PORT = process.env.PORT || 5000;

// Environment Variables with Fallbacks
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emergency_medical_id';
const JWT_SECRET = process.env.JWT_SECRET || 'emergency_medical_secret_2025';
const DOCTOR_SECRET_CODE = process.env.DOCTOR_SECRET_CODE || 'DOCTOR_ONLY_2025';

console.log('🔍 Environment Check:');
console.log(`📡 MONGODB_URI: ${MONGODB_URI}`);
console.log(`🔑 JWT_SECRET: ${JWT_SECRET ? 'Set' : 'Not Set'}`);
console.log(`👨‍⚕️ DOCTOR_SECRET_CODE: ${DOCTOR_SECRET_CODE}`);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, 'public');
console.log(`🔎 Serving frontend from: ${frontendPath}`);
app.use(express.static(frontendPath));

// MongoDB Connection
const connectToDatabase = async () => {
    try {
        console.log(`🔌 Attempting to connect to MongoDB at: ${MONGODB_URI}`);
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            heartbeatFrequencyMS: 10000
        });
        
        console.log('✅ MongoDB Connected Successfully');
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
    }
};

// Connect to database
connectToDatabase();

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        version: '2.0.0'
    });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, role, secretCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        // Doctor secret code check
        if (role === 'doctor') {
            if (!secretCode || secretCode !== DOCTOR_SECRET_CODE) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid secret code for doctor registration.'
                });
            }
        }

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // Create user
        const user = new User({
            email,
            password,
            role: role || 'patient'
        });

        await user.save();

        console.log(`✅ New ${role || 'patient'} registered: ${email}`);

        res.status(201).json({
            success: true,
            message: `${role === 'doctor' ? 'Doctor' : 'Patient'} account created successfully!`
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✅ User logged in: ${email} (${user.role})`);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: { email: user.email, role: user.role }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication token required.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user not found.'
            });
        }

        req.user = decoded;
        req.userDoc = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

// Role Check Middleware
const roleCheck = (allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
        });
    }
    next();
};

// --- PATIENT ROUTES ---

// Get Patient Profile
app.get('/api/patient/profile', authMiddleware, roleCheck(['patient']), async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user.userId });
        res.json({ success: true, patient: patient || null });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
    }
});

// Save Patient Profile
app.post('/api/patient/profile', authMiddleware, roleCheck(['patient']), async (req, res) => {
    try {
        const { personalInfo, medicalInfo, emergencyContact } = req.body;
        
        let patient = await Patient.findOne({ userId: req.user.userId });
        
        if (!patient) {
            patient = new Patient({
                userId: req.user.userId,
                patientId: `EMG-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
            });
        }

        patient.personalInfo = personalInfo;
        patient.medicalInfo = medicalInfo;
        patient.emergencyContact = emergencyContact;
        patient.isProfileFinalized = true;
        patient.updatedAt = new Date();

        // Generate QR Code
        const qrData = {
            patientId: patient.patientId,
            name: `${personalInfo.firstName} ${personalInfo.lastName}`,
            bloodType: personalInfo.bloodType,
            emergencyContact: emergencyContact.phone,
            generatedAt: new Date().toISOString()
        };

        patient.qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        await patient.save();

        console.log(`✅ Patient profile saved: ${patient.patientId}`);

        res.json({
            success: true,
            message: 'Profile saved and QR code generated successfully!',
            patient
        });

    } catch (error) {
        console.error('❌ Profile save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save profile.'
        });
    }
});

// --- DOCTOR ROUTES ---

// Get Patient by ID
app.get('/api/doctor/patient/:patientId', authMiddleware, roleCheck(['doctor']), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const patient = await Patient.findOne({ 
            patientId, 
            isProfileFinalized: true 
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient record not found.'
            });
        }

        // Log access
        const accessLog = new AccessLog({
            patientId,
            accessedBy: req.userDoc.email,
            accessedByUserId: req.user.userId,
            accessType: 'manual_search',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: true
        });
        await accessLog.save();

        console.log(`🔍 Doctor ${req.userDoc.email} accessed patient: ${patientId}`);

        res.json({ success: true, patient, accessTime: new Date().toISOString() });

    } catch (error) {
        console.error('❌ Patient fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve patient information.'
        });
    }
});

// Frontend Routes
app.get('*', (req, res) => {
    const allowedFiles = ['/patient-dashboard.html', '/doctor-dashboard.html'];
    
    if (allowedFiles.includes(req.path)) {
        const filePath = path.join(frontendPath, req.path);
        res.sendFile(filePath);
    } else {
        res.sendFile(path.join(frontendPath, 'index.html'));
    }
});

// Start Server
app.listen(PORT, () => {
    console.log('\n🚀 ===== EMERGENCY MEDICAL ID SYSTEM v2.0 =====');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Doctor Registration Code: ${DOCTOR_SECRET_CODE}`);
    console.log(`⚡ Ready for demonstration!\n`);
});

module.exports = app;