// =====================================
// ULTRA-MODERN PATIENT DASHBOARD v3.0
// Complete Tab Navigation & Features
// =====================================

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Authentication check
    if (!token || user.role !== 'patient') {
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    console.log('🚀 Ultra-Modern Patient Dashboard v3.0 initialized');

    // Initialize all components
    initializeAuthentication(user);
    initializeThemeSystem();
    initializeTabNavigation();
    initializeFormHandlers();
    initializeButtonHandlers();
    await loadPatientProfile();
    
    console.log('✅ All dashboard components loaded successfully');
});

let currentPatientData = null;

// =====================================
// AUTHENTICATION SYSTEM
// =====================================
function initializeAuthentication(user) {
    // Set user email in sidebar
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) {
        userEmailElement.textContent = user.email || 'Patient User';
    }

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                try {
                    // Call logout API
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                } catch (error) {
                    console.log('Logout API call failed, but continuing with local logout');
                }
                
                // Clear local storage and redirect
                localStorage.clear();
                sessionStorage.clear();
                showAlert('Logged out successfully!', 'success');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
        });
    }
}

// =====================================
// THEME SYSTEM
// =====================================
function initializeThemeSystem() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    if (themeToggle && themeIcon) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        themeToggle.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('theme', newTheme);
            
            // Add animation
            themeToggle.style.transform = 'scale(0.8)';
            setTimeout(() => {
                themeToggle.style.transform = 'scale(1)';
            }, 150);
        });
    }
}

// =====================================
// TAB NAVIGATION SYSTEM (CORE FIX)
// =====================================
function initializeTabNavigation() {
    console.log('🔧 Initializing tab navigation system...');
    
    // Get all navigation links and tab panes
    const navLinks = document.querySelectorAll('.nav-link[data-bs-toggle="tab"]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    console.log(`Found ${navLinks.length} navigation links and ${tabPanes.length} tab panes`);
    
    if (navLinks.length === 0 || tabPanes.length === 0) {
        console.error('❌ Navigation elements not found');
        return;
    }
    
    // Remove all existing event listeners to avoid duplicates
    navLinks.forEach(link => {
        link.removeEventListener('click', handleTabClick);
    });
    
    // Add click event listeners to each navigation link
    navLinks.forEach((link, index) => {
        link.addEventListener('click', handleTabClick);
        console.log(`✅ Event listener added to nav link ${index + 1}:`, link.getAttribute('href'));
    });
    
    // Handle initial tab based on URL hash
    const initialHash = window.location.hash || '#overview';
    showTab(initialHash);
    
    // Handle browser back/forward buttons
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '#overview';
        showTab(hash);
    });
    
    console.log('✅ Tab navigation system initialized successfully');
}

function handleTabClick(event) {
    event.preventDefault();
    console.log('🖱️ Tab clicked:', event.currentTarget.getAttribute('href'));
    
    const targetHash = event.currentTarget.getAttribute('href');
    
    // Update URL hash
    history.pushState(null, null, targetHash);
    
    // Show the target tab
    showTab(targetHash);
}

function showTab(hash) {
    console.log('🎯 Switching to tab:', hash);
    
    const targetTabId = hash.replace('#', '') + '-tab';
    
    // Remove active class from all nav links and tab panes
    const allNavLinks = document.querySelectorAll('.nav-link[data-bs-toggle="tab"]');
    const allTabPanes = document.querySelectorAll('.tab-pane');
    
    allNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === hash) {
            link.classList.add('active');
        }
    });
    
    allTabPanes.forEach(pane => {
        pane.classList.remove('active', 'show');
    });
    
    // Show target tab pane
    const targetPane = document.getElementById(targetTabId);
    if (targetPane) {
        targetPane.classList.add('active', 'show', 'fade-in');
        console.log('✅ Tab switched successfully to:', hash);
    } else {
        console.error('❌ Target tab pane not found:', targetTabId);
        // Fallback to overview
        const overviewPane = document.getElementById('overview-tab');
        if (overviewPane) {
            overviewPane.classList.add('active', 'show');
        }
    }
}

// =====================================
// ALERT SYSTEM
// =====================================
function showAlert(message, type = 'success', duration = 5000) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div class="alert alert-${type} fade-in" id="${alertId}">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close" onclick="dismissAlert('${alertId}')">&times;</button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-dismiss
    setTimeout(() => dismissAlert(alertId), duration);
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        danger: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function dismissAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }
}

// Make dismissAlert globally available
window.dismissAlert = dismissAlert;

// =====================================
// FORM HANDLERS
// =====================================
function initializeFormHandlers() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSave);
    }
}

async function handleProfileSave(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveBtn');
    setButtonLoading(saveBtn, true, 'Saving Profile...');
    
    try {
        const profileData = {
            personalInfo: {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                dateOfBirth: document.getElementById('dateOfBirth').value,
                bloodType: document.getElementById('bloodType').value,
            },
            medicalInfo: {
                allergies: document.getElementById('allergies').value
                    .split(',').map(s => s.trim()).filter(s => s.length > 0),
                conditions: document.getElementById('conditions').value
                    .split(',').map(s => s.trim()).filter(s => s.length > 0),
                medications: document.getElementById('medications').value
                    .split(',').map(s => s.trim()).filter(s => s.length > 0)
            },
            emergencyContact: {
                name: document.getElementById('emergencyContactName').value.trim(),
                phone: document.getElementById('emergencyContactPhone').value.trim(),
                relationship: document.getElementById('emergencyContactRelation').value
            }
        };

        // Validation
        if (!profileData.personalInfo.firstName || !profileData.personalInfo.lastName || 
            !profileData.personalInfo.dateOfBirth || !profileData.personalInfo.bloodType ||
            !profileData.emergencyContact.name || !profileData.emergencyContact.phone) {
            showAlert('Please fill in all required fields marked with *', 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch('/api/patient/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (data.success) {
            currentPatientData = data.patient;
            updateUI(data.patient);
            showAlert('🎉 Profile saved successfully! Your QR code has been generated.', 'success');
        } else {
            showAlert(data.message || 'Failed to save profile.', 'danger');
        }
    } catch (error) {
        console.error('Profile save error:', error);
        showAlert('Network error. Please try again.', 'danger');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

// =====================================
// BUTTON HANDLERS
// =====================================
function initializeButtonHandlers() {
    // Download QR Code
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadQRCode);
    }

    // Copy Patient ID
    const copyIdBtn = document.getElementById('copyIdBtn');
    if (copyIdBtn) {
        copyIdBtn.addEventListener('click', copyPatientId);
    }

    // Print QR Code
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printQRCode);
    }

    // Regenerate QR Code
    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', regenerateQRCode);
    }
}

function downloadQRCode() {
    if (!currentPatientData || !currentPatientData.qrCodeImage) {
        showAlert('Please generate your QR code first.', 'warning');
        return;
    }

    const link = document.createElement('a');
    link.href = currentPatientData.qrCodeImage;
    link.download = `emergency-medical-qr-${currentPatientData.patientId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('✅ QR Code downloaded successfully!', 'success');
}

function copyPatientId() {
    if (!currentPatientData) {
        showAlert('Please generate your Patient ID first.', 'warning');
        return;
    }

    const patientId = currentPatientData.patientId;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(patientId).then(() => {
            showAlert('📋 Patient ID copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showAlert('Failed to copy to clipboard.', 'danger');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = patientId;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showAlert('📋 Patient ID copied to clipboard!', 'success');
        } catch (err) {
            showAlert('Failed to copy to clipboard.', 'danger');
        }
        document.body.removeChild(textArea);
    }
}

function printQRCode() {
    if (!currentPatientData || !currentPatientData.qrCodeImage) {
        showAlert('Please generate your QR code first.', 'warning');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Emergency Medical QR Code - ${currentPatientData.patientId}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 40px;
                    color: #333;
                }
                .header { 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #6366f1;
                    padding-bottom: 20px;
                }
                .qr-code { margin: 30px 0; }
                .info { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0;
                    text-align: left;
                }
                .footer {
                    margin-top: 40px;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏥 Emergency Medical ID</h1>
                <h2>${currentPatientData.personalInfo.firstName} ${currentPatientData.personalInfo.lastName}</h2>
            </div>
            <div class="qr-code">
                <img src="${currentPatientData.qrCodeImage}" alt="Emergency QR Code" style="width: 300px;">
            </div>
            <div class="info">
                <p><strong>Patient ID:</strong> ${currentPatientData.patientId}</p>
                <p><strong>Blood Type:</strong> ${currentPatientData.personalInfo.bloodType}</p>
                <p><strong>Emergency Contact:</strong> ${currentPatientData.emergencyContact.name} - ${currentPatientData.emergencyContact.phone}</p>
                ${currentPatientData.medicalInfo.allergies.length > 0 ? `<p><strong>Allergies:</strong> ${currentPatientData.medicalInfo.allergies.join(', ')}</p>` : ''}
                <p><em>Scan QR code for complete medical information</em></p>
            </div>
            <div class="footer">
                <p>Generated: ${new Date().toLocaleDateString()} | Emergency Medical ID System v3.0</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

async function regenerateQRCode() {
    if (!currentPatientData) {
        showAlert('Please save your profile first.', 'warning');
        return;
    }

    const regenerateBtn = document.getElementById('regenerateBtn');
    setButtonLoading(regenerateBtn, true, 'Regenerating...');

    try {
        // Trigger profile save to regenerate QR code
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.click();
        }
    } finally {
        setButtonLoading(regenerateBtn, false);
    }
}

// =====================================
// DATA LOADING AND UI UPDATES
// =====================================
async function loadPatientProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/patient/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success && data.patient) {
            currentPatientData = data.patient;
            populateForm(data.patient);
            updateUI(data.patient);
            updateLastUpdated(data.patient.updatedAt);
        } else {
            console.log('No existing patient profile found');
            updateLastUpdated(null);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile data. Please refresh the page.', 'danger');
    }
}

function populateForm(patient) {
    // Personal information
    document.getElementById('firstName').value = patient.personalInfo?.firstName || '';
    document.getElementById('lastName').value = patient.personalInfo?.lastName || '';
    document.getElementById('dateOfBirth').value = patient.personalInfo?.dateOfBirth?.split('T')[0] || '';
    document.getElementById('bloodType').value = patient.personalInfo?.bloodType || '';
    
    // Medical information
    document.getElementById('allergies').value = patient.medicalInfo?.allergies?.join(', ') || '';
    document.getElementById('conditions').value = patient.medicalInfo?.conditions?.join(', ') || '';
    document.getElementById('medications').value = patient.medicalInfo?.medications?.join(', ') || '';
    
    // Emergency contact
    document.getElementById('emergencyContactName').value = patient.emergencyContact?.name || '';
    document.getElementById('emergencyContactPhone').value = patient.emergencyContact?.phone || '';
    document.getElementById('emergencyContactRelation').value = patient.emergencyContact?.relationship || 'Spouse';
}

function updateUI(patient) {
    // Update status cards
    if (patient.isProfileFinalized) {
        document.getElementById('profileStatus').textContent = 'Complete';
        document.getElementById('profileStatus').className = 'text-success';
    }

    // Update QR status and display
    if (patient.qrCodeImage) {
        document.getElementById('qrStatus').textContent = 'Generated';
        document.getElementById('qrStatus').className = 'text-success';
        
        // Display QR Code
        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = `
            <div class="fade-in text-center">
                <img src="${patient.qrCodeImage}" alt="Emergency QR Code" class="img-fluid mb-3" 
                     style="max-width: 280px; border-radius: 12px;">
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-shield-alt me-1"></i>
                        Scan for Emergency Medical Information
                    </small>
                </div>
            </div>
        `;
    }

    // Update Patient ID displays
    if (patient.patientId) {
        document.getElementById('patientIdStatusDisplay').textContent = patient.patientId;
        document.getElementById('patientIdDisplay').textContent = patient.patientId;
        document.getElementById('sharePatientId').value = patient.patientId;
        
        // Enable buttons
        const buttonsToEnable = ['downloadBtn', 'copyIdBtn', 'printBtn', 'regenerateBtn'];
        buttonsToEnable.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = false;
            }
        });
    }

    // Update completion progress
    updateCompletionProgress(patient);
}

function updateCompletionProgress(patient) {
    const requiredFields = [
        patient.personalInfo?.firstName,
        patient.personalInfo?.lastName, 
        patient.personalInfo?.dateOfBirth,
        patient.personalInfo?.bloodType,
        patient.emergencyContact?.name,
        patient.emergencyContact?.phone
    ];
    
    const completedFields = requiredFields.filter(field => field && field.toString().trim() !== '');
    const percentage = Math.round((completedFields.length / requiredFields.length) * 100);
    
    const progressBar = document.getElementById('completionProgress');
    const percentageElement = document.getElementById('completionPercentage');
    
    if (progressBar && percentageElement) {
        progressBar.style.width = percentage + '%';
        percentageElement.textContent = percentage + '%';
        
        // Update badge color based on completion
        if (percentage >= 100) {
            percentageElement.className = 'badge bg-success';
        } else if (percentage >= 60) {
            percentageElement.className = 'badge bg-warning';
        } else {
            percentageElement.className = 'badge bg-danger';
        }
    }
}

function updateLastUpdated(timestamp) {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        if (timestamp) {
            lastUpdatedElement.textContent = new Date(timestamp).toLocaleDateString();
        } else {
            lastUpdatedElement.textContent = 'Never';
        }
    }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================
function setButtonLoading(button, isLoading, loadingText = 'Processing...') {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.textContent;
    }
}

// Add CSS animation for smooth transitions
const style = document.createElement('style');
style.textContent = `
    .tab-pane {
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }
    
    .tab-pane.active {
        display: block;
        opacity: 1;
    }
    
    @keyframes slideOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

console.log('🎉 Patient Dashboard JavaScript loaded successfully!');
