document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Redirect if not authenticated or not a doctor
    if (!token || user.role !== 'doctor') {
        window.location.href = '/';
        return;
    }

    // Set doctor email
    document.getElementById('doctorEmail').textContent = user.email || 'Medical Professional';

    // DOM elements
    const searchForm = document.getElementById('searchForm');
    const patientIdInput = document.getElementById('patientIdInput');
    const qrFileInput = document.getElementById('qrFileInput');
    const scanQRBtn = document.getElementById('scanQRBtn');
    const processQRBtn = document.getElementById('processQRBtn');
    const qrDataInput = document.getElementById('qrDataInput');
    const patientInfoCard = document.getElementById('patientInfoCard');
    const newSearchBtn = document.getElementById('newSearchBtn');
    const copyInfoBtn = document.getElementById('copyInfoBtn');

    let currentPatientData = null;

    const showAlert = (message, type = 'danger') => {
        const alertContainer = document.getElementById('alert-container');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} fade-in`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
        `;
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    };

    const setButtonLoading = (button, isLoading, text) => {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.textContent;
        }
    };

    // Search by Patient ID
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const patientId = patientIdInput.value.trim();
        if (!patientId) {
            showAlert('Please enter a Patient ID.', 'warning');
            return;
        }

        await fetchPatientData(patientId);
    });

    // Scan QR Code from uploaded file
    scanQRBtn.addEventListener('click', async () => {
        const file = qrFileInput.files[0];
        if (!file) {
            showAlert('Please select an image file first.', 'warning');
            return;
        }

        scanQRBtn.dataset.originalText = scanQRBtn.innerHTML;
        setButtonLoading(scanQRBtn, true, 'Scanning QR Code...');

        try {
            const imageUrl = URL.createObjectURL(file);
            const codeReader = new ZXing.BrowserMultiFormatReader();
            
            const result = await codeReader.decodeFromImageUrl(imageUrl);
            
            if (result) {
                qrDataInput.value = result.text;
                showAlert('✅ QR Code scanned successfully! Click "Process QR Data" to extract Patient ID.', 'success');
            } else {
                showAlert('No QR code found in the image. Please try a clearer image.', 'warning');
            }
            
            URL.revokeObjectURL(imageUrl);
        } catch (error) {
            console.error('QR scanning error:', error);
            showAlert('Failed to scan QR code. Please try a different image or enter the Patient ID manually.', 'danger');
        } finally {
            setButtonLoading(scanQRBtn, false);
        }
    });

    // Process QR Data to extract Patient ID
    processQRBtn.addEventListener('click', () => {
        const qrData = qrDataInput.value.trim();
        if (!qrData) {
            showAlert('Please paste QR code data or scan a QR code first.', 'warning');
            return;
        }

        try {
            // Try to parse as JSON first
            const parsedData = JSON.parse(qrData);
            if (parsedData.patientId) {
                patientIdInput.value = parsedData.patientId;
                showAlert('✅ Patient ID extracted from QR data! Click "Search" to retrieve patient information.', 'success');
                return;
            }
        } catch (e) {
            // Not JSON, try to extract Patient ID pattern
            const patientIdMatch = qrData.match(/EMG-\d+-[A-Z0-9]+/);
            if (patientIdMatch) {
                patientIdInput.value = patientIdMatch[0];
                showAlert('✅ Patient ID extracted! Click "Search" to retrieve patient information.', 'success');
                return;
            }
        }

        showAlert('Could not extract Patient ID from QR data. Please check the data format or enter the ID manually.', 'warning');
    });

    // Fetch Patient Data from API
    const fetchPatientData = async (patientId) => {
        try {
            const response = await fetch(`/api/doctor/patient/${encodeURIComponent(patientId)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                currentPatientData = data.patient;
                displayPatientInfo(data.patient);
                showAlert('✅ Patient information retrieved successfully!', 'success');
            } else {
                showAlert(data.message || 'Patient not found or access denied.', 'danger');
                patientInfoCard.style.display = 'none';
            }
        } catch (error) {
            console.error('Fetch patient data error:', error);
            showAlert('Network error. Please check your connection and try again.', 'danger');
        }
    };

    // Display Patient Information
    const displayPatientInfo = (patient) => {
        const content = document.getElementById('patientInfoContent');
        
        // Calculate age
        const calculateAge = (dateOfBirth) => {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age;
        };

        content.innerHTML = `
            <div class="patient-info fade-in">
                <div class="row">
                    <div class="col-md-8">
                        <h3 class="text-primary mb-3">
                            <i class="fas fa-user me-2"></i>${patient.personalInfo.firstName} ${patient.personalInfo.lastName}
                            <span class="badge bg-primary ms-3">${patient.patientId}</span>
                        </h3>
                        
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <div class="info-row">
                                    <strong><i class="fas fa-calendar me-2"></i>Date of Birth:</strong>
                                    <span>${new Date(patient.personalInfo.dateOfBirth).toLocaleDateString()}</span>
                                </div>
                                <div class="info-row">
                                    <strong><i class="fas fa-user me-2"></i>Age:</strong>
                                    <span>${calculateAge(patient.personalInfo.dateOfBirth)} years</span>
                                </div>
                                <div class="info-row">
                                    <strong><i class="fas fa-tint me-2"></i>Blood Type:</strong>
                                    <span class="badge bg-danger fs-6">${patient.personalInfo.bloodType}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-row">
                                    <strong><i class="fas fa-phone me-2"></i>Emergency Contact:</strong>
                                    <span>${patient.emergencyContact.name}</span>
                                </div>
                                <div class="info-row">
                                    <strong><i class="fas fa-mobile-alt me-2"></i>Contact Phone:</strong>
                                    <span><a href="tel:${patient.emergencyContact.phone}" class="btn btn-sm btn-outline-success">${patient.emergencyContact.phone}</a></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-center">
                        <div class="bg-light p-3 rounded">
                            <h6 class="text-muted">Quick Actions</h6>
                            <div class="d-grid gap-2">
                                <a href="tel:${patient.emergencyContact.phone}" class="btn btn-success btn-sm">
                                    <i class="fas fa-phone me-2"></i>Call Emergency Contact
                                </a>
                                <button class="btn btn-outline-primary btn-sm" onclick="window.print()">
                                    <i class="fas fa-print me-2"></i>Print Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="alert alert-warning">
                            <h5><i class="fas fa-exclamation-triangle me-2"></i>⚠️ ALLERGIES</h5>
                            ${patient.medicalInfo.allergies && patient.medicalInfo.allergies.length > 0 ? 
                                `<ul class="mb-0">${patient.medicalInfo.allergies.map(allergy => `<li><strong>${allergy}</strong></li>`).join('')}</ul>` :
                                '<p class="mb-0 text-success">✅ No known allergies</p>'
                            }
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-info">
                            <h5><i class="fas fa-notes-medical me-2"></i>📋 MEDICAL CONDITIONS</h5>
                            ${patient.medicalInfo.conditions && patient.medicalInfo.conditions.length > 0 ? 
                                `<ul class="mb-0">${patient.medicalInfo.conditions.map(condition => `<li><strong>${condition}</strong></li>`).join('')}</ul>` :
                                '<p class="mb-0 text-success">✅ No known conditions</p>'
                            }
                        </div>
                    </div>
                </div>

                <div class="mt-4 p-3 bg-light rounded">
                    <h6><i class="fas fa-info-circle me-2"></i>Additional Information</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <small><strong>Patient ID:</strong> ${patient.patientId}</small>
                        </div>
                        <div class="col-md-4">
                            <small><strong>Record Updated:</strong> ${new Date(patient.updatedAt).toLocaleDateString()}</small>
                        </div>
                        <div class="col-md-4">
                            <small><strong>Status:</strong> <span class="badge bg-success">Active</span></small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('accessTime').textContent = 
            `Accessed at ${new Date().toLocaleString()}`;
        
        patientInfoCard.style.display = 'block';
        patientInfoCard.scrollIntoView({ behavior: 'smooth' });
    };

    // Copy Patient Information to Clipboard
    copyInfoBtn.addEventListener('click', async () => {
        if (!currentPatientData) {
            showAlert('No patient information to copy.', 'warning');
            return;
        }

        const patient = currentPatientData;
        const copyText = `
EMERGENCY MEDICAL INFORMATION
========================================
Patient: ${patient.personalInfo.firstName} ${patient.personalInfo.lastName}
Patient ID: ${patient.patientId}
Date of Birth: ${new Date(patient.personalInfo.dateOfBirth).toLocaleDateString()}
Blood Type: ${patient.personalInfo.bloodType}

Emergency Contact: ${patient.emergencyContact.name}
Contact Phone: ${patient.emergencyContact.phone}

ALLERGIES: ${patient.medicalInfo.allergies.length > 0 ? patient.medicalInfo.allergies.join(', ') : 'None'}
CONDITIONS: ${patient.medicalInfo.conditions.length > 0 ? patient.medicalInfo.conditions.join(', ') : 'None'}

Accessed: ${new Date().toLocaleString()}
        `.trim();

        try {
            await navigator.clipboard.writeText(copyText);
            showAlert('✅ Patient information copied to clipboard!', 'success');
        } catch (error) {
            showAlert('Failed to copy to clipboard.', 'danger');
        }
    });

    // New Search
    newSearchBtn.addEventListener('click', () => {
        patientInfoCard.style.display = 'none';
        patientIdInput.value = '';
        qrDataInput.value = '';
        qrFileInput.value = '';
        currentPatientData = null;
        
        showAlert('Ready for new patient search.', 'info');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = '/';
        }
    });

    // Store original button texts
    scanQRBtn.dataset.originalText = scanQRBtn.innerHTML;
    processQRBtn.dataset.originalText = processQRBtn.innerHTML;
    
    console.log('🩺 Doctor dashboard initialized successfully');
    showAlert('Welcome! Enter a Patient ID or scan a QR code to access patient records.', 'info');
});
