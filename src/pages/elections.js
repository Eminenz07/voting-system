// Elections Selection Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    createStudentNav('elections');
    const session = requireStudentAuth();
    if (!session) return;

    if (session.user && session.user.role === 'admin') {
        const adminControls = document.getElementById('admin-controls');
        if (adminControls) adminControls.classList.remove('hidden');
    }

    const container = document.getElementById('elections-container');

    try {
        const elections = await apiCall('/elections/');

        if (elections.length === 0) {
            container.innerHTML = `
                <div class="col-span-1 md:col-span-2 text-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">event_busy</span>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white">No Active Elections</h3>
                    <p class="text-slate-500 mt-2">There are currently no elections available for voting.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = elections.map(election => `
            <div class="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-white dark:bg-surface-dark p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 transition-all hover:shadow-md hover:ring-primary/20 dark:hover:ring-primary/40">
                <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <span class="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                            ${election.status === 'active' ? 'Active Now' : election.status}
                        </span>
                    </div>
                    <div>
                        <h4 class="text-xl font-bold text-slate-900 dark:text-white">${election.title}</h4>
                        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            ${election.description || 'Participate in this election to shape the future.'}
                        </p>
                    </div>
                    <div class="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button onclick="goToBallot('${election.id}')" 
                                class="w-full rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#003DA5]/20 hover:bg-primary-dark transition-all flex justify-center items-center gap-2">
                            <span>Open Ballot</span>
                            <span class="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Failed to fetch elections:', err);
        container.innerHTML = `
            <div class="col-span-1 md:col-span-2 text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-600">
                <span class="material-symbols-outlined text-4xl mb-2">error</span>
                <p>Failed to load elections. Please try again later.</p>
            </div>
        `;
    }
});

// Global function to handle routing
window.goToBallot = (electionId) => {
    localStorage.setItem('au-active-election', electionId);
    window.location.href = '/ballot.html';
};
