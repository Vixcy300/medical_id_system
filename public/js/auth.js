document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Authentication system initialized');
    
    // Initialize components
    initializeTabSwitching();
    initializePasswordToggle();
    initializePasswordStrength();
    initializeRoleBasedFields();
    initializeForms();
    
    // Check for existing session
    checkExistingSession();
});

// Tab switching functionality
function initializeTabSwitching() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav links and tab panes
            navLinks.forEach(nl => nl.classList.remove('active'));
            tabPanes.forEach(tp => tp.classList.remove('active'));
            
            // Add active class to clicked nav link
            link.classList.add('active');
            
            // Show corresponding tab pane
            const targetTab = link.getAttribute('data-tab');
            const targetPane = document.getElementById(`${targetTab}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// Password toggle functionality
function initializePasswordToggle() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = button.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = button.querySelector('i');
            
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                targetInput.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
}

// Password strength indicator
function initializePasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthContainer = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (passwordInput && strengthContainer) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);
            updatePasswordStrengthUI(strength, strengthContainer, strengthText);
        });
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Number');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Special character');
    
    const levels = ['weak', 'weak', 'fair', 'good', 'strong'];
    const level = Math.min(score, 4);
    
    return {
        score: level,
        level: levels[level],
        feedback: feedback
    };
}

function updatePasswordStrengthUI(strength, container, textElement) {
    const classes = ['strength-weak', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
    
    // Remove all strength classes
    container.className = 'password-strength mt-2';
    
    // Add current strength class
    if (strength.score >= 0) {
        container.classList.add(classes[strength.score]);
    }
    
    // Update text
    textElement.textContent = `Password strength: ${strength.level}`;
    
    if (strength.feedback.length > 0 && strength.score < 3) {
        textElement.textContent += ` (Add: ${strength.feedback.join(', ')})`;
    }
}

// Role-based field visibility
function initializeRoleBasedFields() {
    const roleSelect = document.getElementById('userRole');
    const secretCodeGroup = document.getElementById('secretCodeGroup');
    const secretCodeInput = document.getElementById('secretCode');
    
    if (roleSelect && secretCodeGroup) {
        roleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'doctor') {
                secretCodeGroup.classList.remove('d-none');
                secretCodeGroup.classList.add('fade-in');
                secretCodeInput.setAttribute('required', true);
            } else {
                secretCodeGroup.classList.add('d-none');
                secretCodeGroup.classList.remove('fade-in');
                secretCodeInput.removeAttribute('required');
                secretCodeInput.value = '';
            }
        });
    }
}

// Form initialization
function initializeForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Alert system
function showAlert(message, type = 'danger', duration = 5000) {
    const alertContainer = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div class="alert alert-${type} fade-in" id="${alertId}">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close" onclick="dismissAlert('${alertId}')">&times;</button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-dismiss after duration
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
        alert.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }
}

// Button loading state
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

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginBtn = document.getElementById('loginBtn');
    
    // Validation
    if (!email || !password) {
        showAlert('Please fill in all required fields.', 'warning');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address.', 'warning');
        return;
    }
    
    setButtonLoading(loginBtn, true, 'Signing In...');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAlert('Login successful! Redirecting to your dashboard...', 'success');
            
            // Add bounce animation to login button
            loginBtn.classList.add('bounce');
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'doctor') {
                    window.location.href = '/doctor-dashboard.html';
                } else {
                    window.location.href = '/patient-dashboard.html';
                }
            }, 1500);
        } else {
            showAlert(data.message || 'Login failed. Please check your credentials.', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please check your connection and try again.', 'danger');
    } finally {
        setButtonLoading(loginBtn, false);
    }
}

// Register handler
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('userRole').value;
    const secretCode = document.getElementById('secretCode').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const registerBtn = document.getElementById('registerBtn');
    
    // Validation
    if (!email || !password || !role) {
        showAlert('Please fill in all required fields.', 'warning');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address.', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'warning');
        return;
    }
    
    if (role === 'doctor' && !secretCode) {
        showAlert('Doctor authorization code is required for medical professional registration.', 'warning');
        return;
    }
    
    if (!agreeTerms) {
        showAlert('Please agree to the Terms of Service and Privacy Policy.', 'warning');
        return;
    }
    
    // Check password strength
    const strength = calculatePasswordStrength(password);
    if (strength.score < 2) {
        showAlert('Please create a stronger password. Add more characters, numbers, or special characters.', 'warning');
        return;
    }
    
    setButtonLoading(registerBtn, true, 'Creating Account...');
    
    try {
        const requestBody = { email, password, role };
        if (role === 'doctor') {
            requestBody.secretCode = secretCode;
        }
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showAlert('Account created successfully! Please login with your credentials.', 'success');
            
            // Reset form and switch to login tab
            document.getElementById('registerForm').reset();
            document.getElementById('secretCodeGroup').classList.add('d-none');
            
            // Switch to login tab
            setTimeout(() => {
                const loginTab = document.querySelector('[data-tab="login"]');
                if (loginTab) {
                    loginTab.click();
                    // Pre-fill login email
                    document.getElementById('loginEmail').value = email;
                    document.getElementById('loginEmail').focus();
                }
            }, 1000);
        } else {
            showAlert(data.message || 'Registration failed. Please try again.', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please check your connection and try again.', 'danger');
    } finally {
        setButtonLoading(registerBtn, false);
    }
}

// Check for existing session
function checkExistingSession() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.role) {
        // Redirect to appropriate dashboard
        if (user.role === 'doctor') {
            window.location.href = '/doctor-dashboard.html';
        } else {
            window.location.href = '/patient-dashboard.html';
        }
    }
}

// Add fade out animation for alerts
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

// Global functions for inline handlers
window.dismissAlert = dismiss
