// Login Page Logic
document.addEventListener('DOMContentLoaded', () => {
    createStudentNav('login');

    const form = document.querySelector('form');
    const matricInput = document.getElementById('matric-no');
    const passwordInput = document.getElementById('password');

    // Fix "Activate Account" link
    document.querySelectorAll('a').forEach(a => {
        if (a.textContent.trim() === 'Activate Account') a.href = '/signup.html';
    });

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

            if (!matric) { showToast('Please enter your matric number', 'error'); matricInput.focus(); return; }
            if (!password) { showToast('Please enter your password', 'error'); passwordInput.focus(); return; }

            // Disable button while loading
            const submitBtn = Array.from(form.querySelectorAll('button')).find(b => b.textContent.includes('Sign In') || b.textContent.includes('Login'));
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Logging in...'; }

            try {
                const data = await apiCall('/auth/login/', {
                    method: 'POST',
                    body: JSON.stringify({ matric, password }),
                });

                // Store token and session
                localStorage.setItem('au-token', data.token);
                setSession(data.user);

                showToast('Welcome, ' + data.user.name.split(' ')[0] + '!', 'success');

                // Redirect based on role
                if (data.user.role === 'admin') {
                    setTimeout(() => window.location.href = '/admin.html', 800);
                } else {
                    setTimeout(() => window.location.href = '/dashboard.html', 800);
                }
            } catch (err) {
                showToast(err.message || 'Login failed', 'error');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In'; }
            }
        };
    }
});
