// Monitoring Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    createAdminNav('monitoring');
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

    const electionId = localStorage.getItem('au-active-election') || '1';

    // Fetch live results for monitoring
    async function refreshMonitoringData() {
        try {
            const data = await apiCall(`/elections/${electionId}/results/`);

            // Update Top KPIs
            const registeredEl = document.getElementById('monitor-registered');
            if (registeredEl) {
                const eligible = data.eligible_voters || Math.round((data.total_votes / (data.turnout / 100))) || 0;
                registeredEl.textContent = eligible.toLocaleString();
            }

            const votesEl = document.getElementById('monitor-votes');
            if (votesEl) votesEl.textContent = data.total_votes.toLocaleString();

            const turnoutEl = document.getElementById('monitor-turnout');
            if (turnoutEl) turnoutEl.textContent = data.turnout.toFixed(1) + '%';

            const turnoutBar = document.getElementById('monitor-turnout-bar');
            if (turnoutBar) turnoutBar.style.width = data.turnout + '%';

            // Render Dynamic Election Results
            const positionsContainer = document.getElementById('monitor-positions-container');
            if (positionsContainer && data.positions) {
                let html = '';

                data.positions.forEach(position => {
                    html += `
                    <div class="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg font-bold text-slate-900">${position.title}</h3>
                            <div class="flex gap-2">
                                <span class="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">Live</span>
                            </div>
                        </div>
                        <div class="space-y-5">
                    `;

                    // Sort candidates by votes descending
                    const sortedCandidates = [...position.candidates].sort((a, b) => b.votes - a.votes);
                    const colors = ['bg-primary', 'bg-slate-400', 'bg-slate-300', 'bg-slate-200'];

                    sortedCandidates.forEach((cand, idx) => {
                        const colorClass = colors[idx] || colors[colors.length - 1];
                        const widthPercent = cand.percentage || 0;

                        html += `
                        <div class="relative">
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-bold text-slate-900">${cand.name} <span class="text-slate-400 font-normal ml-1">(${cand.party || 'Independent'})</span></span>
                                <span class="font-bold ${idx === 0 ? 'text-primary' : 'text-slate-600'}">${cand.votes.toLocaleString()} votes (${widthPercent.toFixed(1)}%)</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                                <div class="${colorClass} h-4 rounded-full transition-all duration-1000 w-0 candidate-bar" data-width="${widthPercent}%"></div>
                            </div>
                        </div>
                        `;
                    });

                    html += `</div></div>`;
                });

                positionsContainer.innerHTML = html;

                // Animate candidate bars
                setTimeout(() => {
                    document.querySelectorAll('.candidate-bar').forEach(bar => {
                        bar.style.width = bar.getAttribute('data-width');
                    });
                }, 100);
            }

            // Note: Overall Participation pie chart / live feed omitted for simplicity unless we bind it here
        } catch (err) {
            console.error('Monitoring refresh failed:', err);
        }
    }

    // Initial load
    await refreshMonitoringData();

    // Refresh every 10 seconds for "live" monitoring
    setInterval(refreshMonitoringData, 10000);
});
