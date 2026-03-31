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

    // --- Position Categories Logic ---
    let activePositions = ['President', 'Vice President', 'General Secretary', 'Treasurer'];
    const positionsList = document.getElementById('positions-list');
    const newCategoryInput = document.getElementById('new-category');
    const addCategoryBtn = document.getElementById('add-category-btn');

    function renderPositions() {
        if (!positionsList) return;
        positionsList.innerHTML = activePositions.map((pos, index) => `
            <div class="inline-flex items-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1 text-sm font-medium text-slate-900 dark:text-white shadow-sm">
                ${pos}
                <button type="button" onclick="window.removePosition(${index})" class="ml-2 inline-flex size-4 items-center justify-center rounded-full text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
            </div>
        `).join('');
    }

    window.removePosition = function(index) {
        activePositions.splice(index, 1);
        renderPositions();
    };

    if (addCategoryBtn && newCategoryInput) {
        addCategoryBtn.addEventListener('click', () => {
            const val = newCategoryInput.value.trim();
            if (val && !activePositions.includes(val)) {
                activePositions.push(val);
                newCategoryInput.value = '';
                renderPositions();
            } else if (activePositions.includes(val)) {
                showToast('Position already exists', 'info');
            }
        });

        newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCategoryBtn.click();
            }
        });

        renderPositions();
    }

    // Find publish/create/save buttons
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();
        if (text.includes('publish') || text.includes('create election') || text.includes('save')) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Gather required form inputs
                const nameInput = document.getElementById('election-name');
                const startInput = document.getElementById('start-date');
                const endInput = document.getElementById('end-date');
                const rulesInput = document.getElementById('rules');
                
                let hasEmpty = false;
                [nameInput, startInput, endInput, rulesInput].forEach(input => {
                    if (input && !input.value?.trim()) {
                        input.classList.add('ring-2', 'ring-red-400');
                        hasEmpty = true;
                        setTimeout(() => input.classList.remove('ring-2', 'ring-red-400'), 3000);
                    }
                });

                if (hasEmpty) { showToast('Please fill in all required fields', 'error'); return; }
                if (activePositions.length === 0) { showToast('Please add at least one position', 'error'); return; }

                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Publishing...';

                const title = nameInput.value.trim();
                const description = rulesInput ? rulesInput.value.trim() : '';
                const startDate = startInput.value ? new Date(startInput.value).toISOString() : new Date().toISOString();
                const endDate = endInput.value ? new Date(endInput.value).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString();

                // Format positions for Django API
                const positionsPayload = activePositions.map((pos, i) => ({
                    title: pos,
                    order: i
                }));

                try {
                    await apiCall('/admin/elections/', {
                        method: 'POST',
                        body: JSON.stringify({
                            title,
                            description,
                            start_date: startDate,
                            end_date: endDate,
                            positions: positionsPayload,
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
