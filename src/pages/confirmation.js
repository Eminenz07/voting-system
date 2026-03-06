// Confirmation Page Logic
document.addEventListener('DOMContentLoaded', () => {
    createStudentNav('confirmation');
    const session = requireStudentAuth();
    if (!session) return;

    const electionId = localStorage.getItem('au-active-election') || '1';

    // Load selections
    const selections = JSON.parse(sessionStorage.getItem('au-ballot-selections') || '{}');
    const ballotData = JSON.parse(localStorage.getItem('au-ballot-data') || '{}');

    // Render confirmations dynamically
    const confirmationList = document.getElementById('confirmation-list');
    if (confirmationList && ballotData.positions) {
        let html = '';
        for (const position of ballotData.positions) {
            const selectedName = selections[position.title];
            if (selectedName && selectedName !== 'Abstain') {
                const candidate = position.candidates.find(c => c.name === selectedName);
                html += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div class="flex items-start gap-4">
                        <div class="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200 dark:border-slate-700">
                            <img alt="Candidate" class="h-full w-full object-cover" src="${candidate?.photo_url || 'https://via.placeholder.com/150'}"/>
                        </div>
                        <div>
                            <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">${position.title}</h3>
                            <p class="text-lg font-semibold text-slate-900 dark:text-white">${selectedName}</p>
                            <p class="text-sm text-slate-600 dark:text-slate-400">${candidate?.party || 'Independent'}</p>
                        </div>
                    </div>
                    <button onclick="window.location.href='/ballot.html'" class="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors w-fit ml-auto sm:ml-0">
                        <span class="material-symbols-outlined text-lg">edit</span> Change
                    </button>
                </div>`;
            } else {
                html += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-slate-50/30 dark:bg-slate-800/10">
                    <div class="flex items-start gap-4">
                        <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                            <span class="material-symbols-outlined text-2xl">block</span>
                        </div>
                        <div>
                            <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">${position.title}</h3>
                            <p class="text-lg font-medium text-slate-500 dark:text-slate-400 italic">Abstained</p>
                            <p class="text-sm text-slate-400 dark:text-slate-500">No selection made</p>
                        </div>
                    </div>
                    <button onclick="window.location.href='/ballot.html'" class="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors w-fit ml-auto sm:ml-0">
                        <span class="material-symbols-outlined text-lg">edit</span> Change
                    </button>
                </div>`;
            }
        }
        confirmationList.innerHTML = html;
    }

    // Find the confirmation checkbox
    const checkbox = document.querySelector('input[type="checkbox"]');
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.toLowerCase().includes('submit') || b.textContent.toLowerCase().includes('confirm'));

    // Disable submit initially
    if (submitBtn && checkbox) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';

        checkbox.addEventListener('change', () => {
            submitBtn.disabled = !checkbox.checked;
            submitBtn.style.opacity = checkbox.checked ? '1' : '0.5';
            submitBtn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
        });
    }

    // Submit vote via API
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (checkbox && !checkbox.checked) {
                showToast('Please confirm your selections first', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Submitting...';

            // Build votes array from ballot data
            const ballotData = JSON.parse(localStorage.getItem('au-ballot-data') || '{}');
            const votes = [];

            if (ballotData.positions) {
                for (const position of ballotData.positions) {
                    const selectedName = selections[position.title];
                    if (selectedName && selectedName !== 'Abstain') {
                        const candidate = position.candidates.find(c => c.name === selectedName);
                        if (candidate) {
                            votes.push({ position_id: position.id, candidate_id: candidate.id });
                        }
                    }
                }
            }

            if (votes.length === 0) {
                showToast('No valid selections found. Please go back and select candidates.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Vote';
                return;
            }

            try {
                const data = await apiCall(`/elections/${electionId}/vote/`, {
                    method: 'POST',
                    body: JSON.stringify({ votes }),
                });

                sessionStorage.removeItem('au-ballot-selections');
                localStorage.removeItem('au-ballot-data');

                showToast(data.message || 'Your vote has been submitted successfully!', 'success');

                submitBtn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span> Vote Submitted!';
                submitBtn.classList.remove('bg-primary');
                submitBtn.classList.add('bg-green-600');

                setTimeout(() => window.location.href = '/results.html', 2000);
            } catch (err) {
                showToast(err.message || 'Failed to submit vote', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Vote';
            }
        });
    }

    // Back button -> ballot
    document.querySelectorAll('a, button').forEach(el => {
        const text = el.textContent.trim().toLowerCase();
        if (text.includes('back') || text.includes('edit') || text.includes('modify')) {
            el.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/ballot.html'; });
        }
    });
});
