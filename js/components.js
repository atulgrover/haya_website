'use strict';

/**
 * HAYAGRIVA Component Loader & In-Page SSO Auth Modal
 * Asynchronously loads shared components and provides the in-page Auth Modal with blurred backdrop.
 */

let authIsSignup = false;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load footer
    const footerContainer = document.getElementById('site-footer');
    if (footerContainer) {
        try {
            const res = await fetch('/components/footer.html?v=' + Date.now());
            if (res.ok) {
                const html = await res.text();
                footerContainer.innerHTML = html;
            }
        } catch (err) {
            console.error('[HAYAGRIVA Components] Error loading footer:', err.message);
        }
    }

    // 2. Inject Auth Modal HTML & CSS into document body
    injectAuthModal();

    // 3. Update auth buttons across page
    updateAuthButtonsUI();

    // 4. Auto-open modal if URL query ?login=1 or ?signup=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === '1' || params.get('auth') === '1') {
        openAuthModal(false);
    } else if (params.get('signup') === '1') {
        openAuthModal(true);
    }
});

/* ── Inject Auth Modal HTML & CSS ────────────────────────────── */
function injectAuthModal() {
    if (document.getElementById('authModalOverlay')) return;

    // Inject Stylesheet for Auth Modal
    const style = document.createElement('style');
    style.id = 'authModalStyles';
    style.textContent = `
        .auth-modal-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 5000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .auth-modal-overlay.active { display: flex; animation: authModalPop 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes authModalPop {
            from { opacity: 0; transform: scale(0.94); }
            to   { opacity: 1; transform: scale(1); }
        }
        .auth-modal-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            width: 100%;
            max-width: 420px;
            padding: 28px 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            position: relative;
            box-sizing: border-box;
        }
        .auth-modal-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 4px;
        }
        .auth-modal-title {
            font-family: 'Google Sans', 'Lato', sans-serif;
            font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: 0.5px;
        }
        .auth-modal-close {
            background: #F1F5F9; border: none; color: #64748B;
            width: 32px; height: 32px; border-radius: 50%;
            font-size: 16px; cursor: pointer; display: flex;
            align-items: center; justify-content: center; transition: background 0.2s;
        }
        .auth-modal-close:hover { background: #E2E8F0; color: #0F172A; }
        .auth-modal-sub { font-size: 13px; color: #64748B; margin-bottom: 18px; line-height: 1.4; }
        .auth-modal-form .form-group { margin-bottom: 14px; text-align: left; }
        .auth-modal-form .form-label { display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 5px; }
        .auth-modal-form .form-input, .auth-modal-form .form-select {
            width: 100%; padding: 10px 13px; border: 1px solid #CBD5E1;
            border-radius: 8px; font-size: 14px; font-family: inherit;
            background: #F8FAFC; color: #0F172A; outline: none; transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .auth-modal-form .form-input:focus, .auth-modal-form .form-select:focus {
            border-color: #1E6C93; background: #FFFFFF;
        }
        .auth-modal-btn {
            width: 100%; padding: 12px; background: #1E6C93; color: #FFFFFF;
            border: none; border-radius: 8px; font-weight: 700; font-size: 15px;
            cursor: pointer; transition: background 0.2s; margin-top: 6px;
        }
        .auth-modal-btn:hover { background: #165272; }
        .auth-modal-alert {
            padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; display: none; text-align: center;
        }
        .auth-modal-alert.error { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
        .auth-modal-alert.success { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
        .auth-modal-toggle { text-align: center; margin-top: 16px; font-size: 13px; color: #64748B; }
        .auth-modal-toggle a { color: #1E6C93; font-weight: 700; text-decoration: none; margin-left: 4px; }
        .auth-modal-toggle a:hover { text-decoration: underline; }
    `;
    document.head.appendChild(style);

    // Inject Modal HTML
    const modalHTML = `
        <div class="auth-modal-overlay" id="authModalOverlay" onclick="handleAuthOverlayClick(event)">
            <div class="auth-modal-card" id="authModalCard">
                <div class="auth-modal-header">
                    <h2 class="auth-modal-title" id="authModalTitle">HAYAGRIVA SSO</h2>
                    <button class="auth-modal-close" onclick="closeAuthModal()">✕</button>
                </div>
                <p class="auth-modal-sub" id="authModalSub">Single Sign-On for Students, Employees &amp; Professionals</p>
                <div class="auth-modal-alert" id="authModalAlert"></div>
                <form class="auth-modal-form" id="authModalForm" onsubmit="handleAuthSubmit(event)">
                    <div class="form-group">
                        <label class="form-label" for="authRole">Account Persona &amp; Role</label>
                        <select id="authRole" class="form-select" onchange="toggleAuthRoleFields()">
                            <option value="student">Student</option>
                            <option value="employee">Employee</option>
                            <option value="professional">Professional</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="authEmail">Email Address</label>
                        <input type="email" id="authEmail" class="form-input" placeholder="name@domain.com" required />
                    </div>
                    <div class="form-group" id="authFullNameGroup" style="display: none;">
                        <label class="form-label" for="authFullName">Full Name</label>
                        <input type="text" id="authFullName" class="form-input" placeholder="Your Full Name" />
                    </div>
                    <div class="form-group" id="authCompanyGroup" style="display: none;">
                        <label class="form-label" for="authCompanyId">Company ID / Domain</label>
                        <input type="text" id="authCompanyId" class="form-input" placeholder="e.g. acme_corp" />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="authPassword">Password</label>
                        <input type="password" id="authPassword" class="form-input" placeholder="••••••••" required />
                    </div>
                    <button type="submit" class="auth-modal-btn" id="authSubmitBtn">Sign In</button>
                </form>
                <div class="auth-modal-toggle">
                    <span id="authToggleText">Don't have an account?</span>
                    <a href="#" onclick="toggleAuthMode(event)" id="authToggleLink">Create One</a>
                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);
}

/* ── Modal Control Functions ─────────────────────────────────── */
function openAuthModal(signup = false) {
    injectAuthModal();
    authIsSignup = signup;
    const overlay = document.getElementById('authModalOverlay');
    if (!overlay) return;

    const alertBox = document.getElementById('authModalAlert');
    if (alertBox) alertBox.style.display = 'none';

    document.getElementById('authFullNameGroup').style.display = authIsSignup ? 'block' : 'none';
    document.getElementById('authSubmitBtn').innerText = authIsSignup ? 'Create Account' : 'Sign In';
    document.getElementById('authToggleText').innerText = authIsSignup ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('authToggleLink').innerText = authIsSignup ? 'Sign In' : 'Create One';

    toggleAuthRoleFields();
    overlay.classList.add('active');
}

function closeAuthModal() {
    const overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function handleAuthOverlayClick(e) {
    if (e.target.id === 'authModalOverlay') closeAuthModal();
}

function toggleAuthMode(e) {
    if (e) e.preventDefault();
    openAuthModal(!authIsSignup);
}

function toggleAuthRoleFields() {
    const roleSelect = document.getElementById('authRole');
    const companyGroup = document.getElementById('authCompanyGroup');
    if (roleSelect && companyGroup) {
        const r = roleSelect.value;
        companyGroup.style.display = (r === 'employee') ? 'block' : 'none';
    }
}

/* ── Auth Form Handler ───────────────────────────────────────── */
async function handleAuthSubmit(e) {
    e.preventDefault();
    const email     = document.getElementById('authEmail').value.trim();
    const password  = document.getElementById('authPassword').value.trim();
    const role      = document.getElementById('authRole').value;
    const fullName  = document.getElementById('authFullName').value.trim();
    const companyId = document.getElementById('authCompanyId').value.trim();

    const alertBox  = document.getElementById('authModalAlert');
    const btn       = document.getElementById('authSubmitBtn');

    btn.disabled = true;
    btn.innerText = 'Please wait...';

    const endpoint = authIsSignup ? '/api/auth/signup' : '/api/auth/login';
    const body     = authIsSignup
        ? { email, password, fullName, role, companyId }
        : { email, password };

    try {
        const res  = await fetch(endpoint, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('haya_token', data.token);
            localStorage.setItem('haya_user', JSON.stringify(data.user));

            alertBox.className = 'auth-modal-alert success';
            alertBox.innerText = `Welcome ${data.user.fullName || data.user.email}! Redirecting...`;
            alertBox.style.display = 'block';

            setTimeout(() => {
                closeAuthModal();
                updateAuthButtonsUI();
                if (data.user.role === 'student' && !window.location.pathname.endsWith('students.html')) {
                    window.location.href = 'students.html';
                } else if (data.user.role === 'employee' && !window.location.pathname.endsWith('employees.html')) {
                    window.location.href = 'employees.html';
                } else if (data.user.role === 'professional' && !window.location.pathname.endsWith('professionals.html')) {
                    window.location.href = 'professionals.html';
                } else {
                    window.location.reload();
                }
            }, 800);
        } else {
            alertBox.className = 'auth-modal-alert error';
            alertBox.innerText = data.error || 'Authentication failed.';
            alertBox.style.display = 'block';
        }
    } catch (err) {
        alertBox.className = 'auth-modal-alert error';
        alertBox.innerText = 'Network error. Please try again.';
        alertBox.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerText = authIsSignup ? 'Create Account' : 'Sign In';
    }
}

/* ── UI Auth State Updater ───────────────────────────────────── */
function updateAuthButtonsUI() {
    const userJson = localStorage.getItem('haya_user');
    const user     = userJson ? JSON.parse(userJson) : null;

    document.querySelectorAll('.login-btn, #main-auth-btn').forEach(btn => {
        if (user) {
            btn.textContent = user.fullName || user.email.split('@')[0];
            btn.setAttribute('onclick', 'openAuthModal(false)');
        } else {
            btn.textContent = 'Login';
            btn.setAttribute('onclick', 'openAuthModal(false)');
        }
    });
}
