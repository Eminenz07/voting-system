// ============================================
// AU Voting System - Shared Frontend Logic
// ============================================

const API_BASE = 'http://localhost:8000/api';

// --- Dark Mode ---
function initDarkMode() {
    const saved = localStorage.getItem('au-dark-mode');
    if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('au-dark-mode', document.documentElement.classList.contains('dark'));
    updateToggleIcon();
}

function updateToggleIcon() {
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
        }
    }
}

// --- API Client ---
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('au-token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Token ${token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMsg = data.error || data.detail || Object.values(data).flat().join(', ') || 'Request failed';
        throw { status: response.status, message: errorMsg, data };
    }
    return data;
}

// --- Auth Helpers ---
function getSession() {
    try { return JSON.parse(localStorage.getItem('au-session')); } catch { return null; }
}

function setSession(data) {
    localStorage.setItem('au-session', JSON.stringify(data));
}

function clearSession() {
    localStorage.removeItem('au-session');
    localStorage.removeItem('au-token');
}

function requireStudentAuth() {
    const s = getSession();
    if (!s || s.role !== 'student') { window.location.href = '/'; return null; }
    return s;
}

function requireAdminAuth() {
    const s = getSession();
    if (!s || s.role !== 'admin') { window.location.href = '/'; return null; }
    return s;
}

async function logout() {
    try { await apiCall('/auth/logout/', { method: 'POST' }); } catch { }
    clearSession();
    window.location.href = '/';
}

// --- Toast Notifications ---
function showToast(message, type) {
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-primary'
    };
    const toast = document.createElement('div');
    toast.className = 'fixed top-6 right-6 z-[200] ' + (colors[type] || colors.info) + ' text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in font-medium text-sm';
    toast.innerHTML = '<span class="material-symbols-outlined text-lg">' +
        (type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info') +
        '</span>' + message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// --- Student Navigation (Floating FAB) ---
function createStudentNav(currentPage) {
    const pages = [
        { href: '/dashboard.html', icon: 'space_dashboard', label: 'Dashboard', id: 'dashboard' },
        { href: '/elections.html', icon: 'how_to_vote', label: 'Elections', id: 'elections' },
        { href: '/results.html', icon: 'bar_chart', label: 'Election Results', id: 'results' },
        { href: '/profile.html', icon: 'account_circle', label: 'My Profile', id: 'profile' },
    ];
    _createFloatingNav(pages, currentPage);
}

// --- Admin Navigation (Floating FAB) ---
function createAdminNav(currentPage) {
    const pages = [
        { href: '/admin.html', icon: 'admin_panel_settings', label: 'Dashboard', id: 'admin' },
        { href: '/monitoring.html', icon: 'analytics', label: 'Live Monitoring', id: 'monitoring' },
        { href: '/create-election.html', icon: 'add_circle', label: 'Create Election', id: 'create-election' },
        { href: '/admin-results.html', icon: 'assessment', label: 'Results Report', id: 'admin-results' },
        { href: '/admin-settings.html', icon: 'settings', label: 'Profile & Settings', id: 'admin-settings' },
    ];
    _createFloatingNav(pages, currentPage);
}

// --- Floating Nav Builder (shared) ---
function _createFloatingNav(pages, currentPage) {
    const nav = document.createElement('div');
    nav.id = 'floating-nav';
    nav.innerHTML = `
    <button id="nav-toggle" onclick="document.getElementById('floating-nav').classList.toggle('open')"
      class="fixed bottom-6 left-6 z-[100] size-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-[#002D7A] transition-all hover:scale-105 active:scale-95 cursor-pointer">
      <span class="material-symbols-outlined text-2xl">menu</span>
    </button>
    <div id="nav-panel" class="fixed bottom-24 left-6 z-[99] bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 w-64 transition-all origin-bottom-left scale-0 opacity-0">
      <div class="flex items-center justify-between px-3 py-2 mb-2 border-b border-slate-100 dark:border-slate-800">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
        <button id="dark-mode-toggle" onclick="toggleDarkMode()" class="size-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
          <span class="material-symbols-outlined text-lg">${document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
      <nav class="flex flex-col gap-0.5 max-h-80 overflow-y-auto">
        ${pages.map(p => `
          <a href="${p.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${p.id === currentPage
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }">
            <span class="material-symbols-outlined text-lg">${p.icon}</span>
            ${p.label}
          </a>
        `).join('')}
      </nav>
    </div>
  `;
    document.body.appendChild(nav);

    const style = document.createElement('style');
    style.textContent = `
    #floating-nav.open #nav-panel { transform: scale(1); opacity: 1; }
    #floating-nav.open #nav-toggle { background: #ef4444; }
    #floating-nav.open #nav-toggle span { font-size: 0; }
    #floating-nav.open #nav-toggle span::after { content: 'close'; font-size: 24px; font-family: 'Material Symbols Outlined'; }
    #nav-panel { transition: transform 0.2s ease, opacity 0.2s ease; }
    .animate-slide-in { animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { opacity:0; transform: translateX(100px); } to { opacity:1; transform: translateX(0); } }
  `;
    document.head.appendChild(style);

    document.addEventListener('click', (e) => {
        const nav = document.getElementById('floating-nav');
        if (nav && !nav.contains(e.target)) nav.classList.remove('open');
    });
}

// Init dark mode on every page
initDarkMode();
