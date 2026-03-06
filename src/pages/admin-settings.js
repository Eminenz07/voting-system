// Admin Settings Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    createAdminNav('admin-settings');
    const session = requireAdminAuth();
    if (!session) return;

    // Fix sidebar navigation links
    document.querySelectorAll('aside a, nav a').forEach(a => {
        const text = a.textContent.trim().toLowerCase();
        if (text.includes('dashboard') || text === 'dashboard') a.href = '/admin.html';
        else if (text.includes('create election')) a.href = '/create-election.html';
        else if (text.includes('live monitoring') || text.includes('monitoring')) a.href = '/monitoring.html';
        else if (text.includes('results') || text.includes('report')) a.href = '/admin-results.html';
        else if (text.includes('settings')) a.href = '/admin-settings.html';
        else if (text.includes('log out') || text.includes('logout')) {
            a.href = '#';
            a.addEventListener('click', (e) => { e.preventDefault(); logout(); });
        }
    });

    // Fetch profile from API
    try {
        const user = await apiCall('/auth/profile/');

        // Update admin name displays
        document.querySelectorAll('h2, h3, h4, p, span').forEach(el => {
            if (el.textContent.includes('Dr. Adebayo') || el.textContent.includes('Admin Name')) {
                el.textContent = el.textContent.replace(/Dr\. Adebayo|Admin Name/g, user.name);
            }
        });
    } catch (err) {
        console.error('Failed to fetch profile:', err);
    }

    // Save / Cancel buttons
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();

        if (text.includes('save') || text.includes('update profile')) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Saving...';

                try {
                    await apiCall('/auth/profile/', {
                        method: 'PUT',
                        body: JSON.stringify({
                            first_name: session.name?.split(' ')[0] || '',
                            last_name: session.name?.split(' ').slice(1).join(' ') || '',
                        }),
                    });
                    showToast('Settings saved successfully!', 'success');
                } catch (err) {
                    showToast(err.message || 'Failed to save settings', 'error');
                }
                btn.disabled = false;
                btn.textContent = 'Save Changes';
            });
        }

        if (text.includes('cancel')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Changes discarded', 'info');
            });
        }

        // Password update
        if (text.includes('update password') || text.includes('change password')) {
            btn.addEventListener('click', () => showToast('Password update coming soon', 'info'));
        }

        // 2FA
        if (text.includes('enable 2fa') || text.includes('two-factor') || text.includes('configure')) {
            btn.addEventListener('click', () => showToast('Two-factor authentication coming soon', 'info'));
        }

        // Deactivate
        if (text.includes('deactivate')) {
            btn.addEventListener('click', () => showToast('Account deactivation requires super admin approval', 'error'));
        }

        // Download report
        if (text.includes('download') || text.includes('export')) {
            btn.addEventListener('click', () => window.print());
        }
    });
});
