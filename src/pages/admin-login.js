// Admin Login Page Logic
document.addEventListener('DOMContentLoaded', () => {

    const form = document.querySelector('form');
    const matricInput = document.getElementById('matric-no');
    const passwordInput = document.getElementById('password');

    // Password visibility toggle
    const toggleBtn = passwordInput?.parentElement?.querySelector('button');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            toggleBtn.querySelector('.material-symbols-outlined').textContent = isPassword ? 'visibility_off' : 'visibility';
        });
    }

    // Form submission
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const matric = matricInput?.value?.trim();
            const password = passwordInput?.value;

            if (!matric) { showToast('Please enter your Administrator ID', 'error'); matricInput.focus(); return; }
            if (!password) { showToast('Please enter your password', 'error'); passwordInput.focus(); return; }

            // Disable button while loading
            const submitBtn = Array.from(form.querySelectorAll('button')).find(b => b.textContent.includes('Sign In') || b.textContent.includes('Login'));
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Authenticating...'; }

            try {
                const data = await apiCall('/auth/login/', {
                    method: 'POST',
                    body: JSON.stringify({ matric, password }),
                });

                // Enforce Admin Role checking
                if (data.user.role !== 'admin') {
                    showToast('Access Denied: You are not an administrator.', 'error');
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>Sign In</span><span class="material-symbols-outlined text-lg">login</span>'; }
                    return;
                }

                // Store token and session
                localStorage.setItem('au-token', data.token);
                setSession(data.user);

                showToast('Welcome back, Admin', 'success');
                setTimeout(() => window.location.href = '/admin.html', 800);

            } catch (err) {
                showToast(err.message || 'Authentication failed', 'error');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>Sign In</span><span class="material-symbols-outlined text-lg">login</span>'; }
            }
        };
    }
});
