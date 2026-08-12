'use strict';

/**
 * HAYAGRIVA Component Loader & In-Page SSO Auth Modal + User Profile Dropdown
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

    // 3. Update auth buttons & dropdown UI
    updateAuthButtonsUI();

    // 4. Close dropdown on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('userProfileDropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            const isClickInside = e.target.closest('.user-profile-dropdown') || e.target.closest('.user-profile-trigger');
            if (!isClickInside) {
                dropdown.classList.remove('active');
            }
        }
    });

    // 5. Auto-open modal if URL query ?login=1 or ?signup=1
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

    // Inject Stylesheet for Auth Modal & Profile Dropdown
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

        /* ── User Profile Dropdown ────────────────────────────── */
        .user-profile-dropdown {
            position: absolute;
            top: calc(100% + 6px);
            right: 0;
            width: 180px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            z-index: 5500;
            display: none;
            flex-direction: column;
            padding: 4px 0;
            box-sizing: border-box;
            animation: userDropdownPop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .user-profile-dropdown.active { display: flex; }
        @keyframes userDropdownPop {
            from { opacity: 0; transform: translateY(-4px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .user-profile-header {
            padding: 8px 12px 6px;
            border-bottom: 1px solid #F1F5F9;
            text-align: left;
        }
        .user-profile-name {
            font-weight: 700;
            font-size: 13px;
            color: #0F172A;
            margin-bottom: 1px;
            word-break: break-word;
        }
        .user-profile-email {
            font-size: 11px;
            color: #64748B;
            margin-bottom: 4px;
            word-break: break-all;
        }
        .user-profile-role-badge {
            display: inline-block;
            font-size: 9px;
            font-weight: 700;
            color: #1E6C93;
            background: rgba(30, 108, 147, 0.1);
            padding: 1px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .user-profile-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
            color: #334155;
            font-size: 12.5px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
            text-align: left;
        }
        .user-profile-item:hover {
            background: #F8FAFC;
            color: #1E6C93;
        }
        .user-profile-item.logout {
            color: #DC2626;
            border-top: 1px solid #F1F5F9;
            margin-top: 2px;
        }
        .user-profile-item.logout:hover {
            background: #FEE2E2;
        }
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
                            <option value="admin">Administrator</option>
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

/* ── Modal & Dropdown Control Functions ───────────────────────── */
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

function toggleUserDropdown(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const dropdown = document.getElementById('userProfileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function handleSignOut(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('haya_token');
    localStorage.removeItem('haya_portal_token');
    localStorage.removeItem('haya_user');
    const dropdown = document.getElementById('userProfileDropdown');
    if (dropdown) dropdown.classList.remove('active');
    updateAuthButtonsUI();
    window.location.reload();
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
            localStorage.setItem('haya_portal_token', data.token);
            localStorage.setItem('haya_user', JSON.stringify(data.user));

            alertBox.className = 'auth-modal-alert success';
            alertBox.innerText = `Welcome ${data.user.fullName || data.user.email}! Redirecting...`;
            alertBox.style.display = 'block';

            setTimeout(() => {
                closeAuthModal();
                updateAuthButtonsUI();
                if (data.user.role === 'admin') {
                    window.location.href = 'dashboard.html?tab=curator';
                } else if (data.user.role === 'student' && !window.location.pathname.endsWith('students.html')) {
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

/* ── UI Auth State & Dropdown Updater ──────────────────────────── */
function updateAuthButtonsUI() {
    const userJson = localStorage.getItem('haya_user');
    const user     = userJson ? JSON.parse(userJson) : null;

    document.querySelectorAll('.login-btn, #main-auth-btn').forEach(btn => {
        const parent = btn.parentElement;
        if (parent) parent.style.position = 'relative';

        if (user) {
            const userName = user.fullName || user.email.split('@')[0];
            btn.textContent = `${userName} ▾`;
            btn.classList.add('user-profile-trigger');
            btn.setAttribute('onclick', 'toggleUserDropdown(event)');

            // Map user role to portal page
            let portalPage = 'dashboard.html';
            let portalLabel = 'Go to Employee Portal';

            if (user.role === 'admin') {
                portalPage = 'admin.html';
                portalLabel = 'ReelCurator Agent';
            } else if (user.role === 'student') {
                portalPage = 'students.html';
                portalLabel = 'Student Portal';
            } else if (user.role === 'professional') {
                portalPage = 'professionals.html';
                portalLabel = 'Professional Portal';
            } else {
                portalPage = 'dashboard.html';
                portalLabel = 'Employee Portal';
            }

            // Create/update User Profile Dropdown attached to parent
            let dropdown = parent.querySelector('#userProfileDropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.id = 'userProfileDropdown';
                dropdown.className = 'user-profile-dropdown';
                parent.appendChild(dropdown);
            }

            dropdown.innerHTML = `
                <div class="user-profile-header">
                    <div class="user-profile-name">${userName}</div>
                    <div class="user-profile-email">${user.email}</div>
                    <span class="user-profile-role-badge">${user.role || 'Member'}</span>
                </div>
                <a href="${portalPage}" class="user-profile-item">${portalLabel}</a>
                <a href="billing.html" class="user-profile-item">License &amp; Billing</a>
                <a href="dashboard.html" class="user-profile-item">Asset Library</a>
                <a href="#" onclick="handleSignOut(event)" class="user-profile-item logout">Sign Out</a>
            `;
        } else {
            btn.textContent = 'Login';
            btn.classList.remove('user-profile-trigger');
            btn.setAttribute('onclick', 'openAuthModal(false); return false;');

            const dropdown = parent ? parent.querySelector('#userProfileDropdown') : null;
            if (dropdown) dropdown.remove();
        }
    });
}
