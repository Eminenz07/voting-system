// Sign Up Page Logic
document.addEventListener('DOMContentLoaded', () => {
    createStudentNav('signup');

    const form = document.querySelector('form');
    const inputs = form?.querySelectorAll('input');
    const selects = form?.querySelectorAll('select');
    // Find the actual Sign Up button by text content
    const signUpBtn = Array.from(form?.querySelectorAll('button') || []).find(b => b.textContent.includes('Sign Up'));

    // Fix "Login" link
    document.querySelectorAll('a').forEach(a => {
        if (a.textContent.trim() === 'Login') a.href = '/';
    });

    // Department -> Faculty auto-fill
    const deptFacultyMap = {
        cs: 'Science',
        law: 'Law',
        mass_comm: 'Arts',
        accounting: 'Management Sciences',
    };
    const deptSelect = selects?.[0];
    const facultyInput = form?.querySelector('input[readonly]');
    if (deptSelect && facultyInput) {
        deptSelect.addEventListener('change', () => {
            facultyInput.value = deptFacultyMap[deptSelect.value] || '';
        });
    }

    // Password visibility toggles
    form?.querySelectorAll('button[type="button"]').forEach(btn => {
        if (btn === signUpBtn) return;
        btn.addEventListener('click', () => {
            const input = btn.closest('.relative')?.querySelector('input');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.querySelector('.material-symbols-outlined').textContent = isPassword ? 'visibility_off' : 'visibility';
            }
        });
    });

    // Sign Up action
    if (signUpBtn) {
        signUpBtn.addEventListener('click', async () => {
            const name = inputs[0]?.value?.trim();
            const matric = inputs[1]?.value?.trim();
            const dept = deptSelect?.value;
            // inputs[2] is the readonly Faculty input, so password is [3] and confirm is [4]
            const password = inputs[3]?.value;
            const confirmPassword = inputs[4]?.value;

            if (!name) { showToast('Please enter your full name', 'error'); inputs[0].focus(); return; }
            if (!matric) { showToast('Please enter your matric number', 'error'); inputs[1].focus(); return; }
            if (!dept) { showToast('Please select a department', 'error'); return; }
            if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'error'); inputs[3].focus(); return; }
            if (password !== confirmPassword) { showToast('Passwords do not match', 'error'); inputs[4].focus(); return; }

            // Parse name into first/last
            const nameParts = name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            signUpBtn.disabled = true;
            signUpBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Creating account...';

            try {
                await apiCall('/auth/register/', {
                    method: 'POST',
                    body: JSON.stringify({
                        matric,
                        first_name: firstName,
                        last_name: lastName,
                        department: deptSelect.options[deptSelect.selectedIndex].text,
                        faculty: deptFacultyMap[dept] || '',
                        password,
                        confirm_password: confirmPassword,
                    }),
                });

                showToast('Account created! Please log in.', 'success');
                setTimeout(() => window.location.href = '/', 1200);
            } catch (err) {
                showToast(err.message || 'Registration failed', 'error');
                signUpBtn.disabled = false;
                signUpBtn.textContent = 'Create Account';
            }
        });
    }
});
