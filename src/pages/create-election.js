// Create Election Page Logic
document.addEventListener('DOMContentLoaded', () => {
    createAdminNav('create-election');
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

    // Find publish/create/save buttons
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();
        if (text.includes('publish') || text.includes('create') || text.includes('save')) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Gather form data
                const inputs = document.querySelectorAll('input[type="text"], input[type="date"], input[type="datetime-local"], textarea');
                let hasEmpty = false;
                inputs.forEach(input => {
                    if (!input.value?.trim() && input.offsetParent !== null) {
                        input.classList.add('ring-2', 'ring-red-400');
                        hasEmpty = true;
                        setTimeout(() => input.classList.remove('ring-2', 'ring-red-400'), 3000);
                    }
                });

                if (hasEmpty) { showToast('Please fill in all required fields', 'error'); return; }

                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Publishing...';

                // Collect form values
                const title = inputs[0]?.value || 'New Election';
                const description = document.querySelector('textarea')?.value || '';

                try {
                    await apiCall('/admin/elections/', {
                        method: 'POST',
                        body: JSON.stringify({
                            title,
                            description,
                            start_date: new Date().toISOString(),
                            end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
                            positions: [],
                        }),
                    });

                    showToast('Election published successfully!', 'success');
                    btn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span> Published!';
                    btn.classList.remove('bg-primary');
                    btn.classList.add('bg-green-600');
                    setTimeout(() => window.location.href = '/admin.html', 1500);
                } catch (err) {
                    showToast(err.message || 'Failed to create election', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Publish Election';
                }
            });
        }
    });
});
