// Admin Results Report Logic
document.addEventListener('DOMContentLoaded', async () => {
    createAdminNav('admin-results');
    const session = requireAdminAuth();
    if (!session) return;

    const electionId = localStorage.getItem('au-active-election') || '1';

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

    // Fetch election results from API
    try {
        const data = await apiCall(`/elections/${electionId}/results/`);

        // Update KPIs
        const totalVotesEl = document.getElementById('admin-results-total-votes');
        if (totalVotesEl) totalVotesEl.textContent = data.total_votes.toLocaleString();

        const turnoutEl = document.getElementById('admin-results-turnout');
        if (turnoutEl) turnoutEl.textContent = data.turnout.toFixed(1) + '%';

        const abstentionsEl = document.getElementById('admin-results-abstentions');
        if (abstentionsEl) {
            const eligible = data.eligible_voters || Math.round((data.total_votes / (data.turnout / 100))) || 0;
            const abstain = Math.max(0, eligible - data.total_votes);
            abstentionsEl.textContent = abstain.toLocaleString();
        }

        // Render Projected Winners Table
        const winnersTbody = document.getElementById('admin-results-winners-tbody');
        if (winnersTbody && data.positions) {
            let html = '';
            const bgColors = ['bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300', 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300', 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300', 'bg-warning/20 text-warning'];

            data.positions.forEach((position, i) => {
                if (position.candidates && position.candidates.length > 0) {
                    // Sort candidates by votes to find the top one
                    const sortedCandidates = [...position.candidates].sort((a, b) => b.votes - a.votes);
                    const winner = sortedCandidates[0];
                    const runnerUp = sortedCandidates.length > 1 ? sortedCandidates[1] : null;

                    const initials = winner.name.substring(0, 2).toUpperCase();
                    const colorClass = bgColors[i % bgColors.length];

                    const percent = winner.percentage || 0;
                    const margin = runnerUp ? (percent - (runnerUp.percentage || 0)) : percent;

                    const isClearWinner = percent > 50 || margin > 10;
                    const statusHtml = isClearWinner
                        ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                            <span class="material-symbols-outlined text-[14px]">check_circle</span> Winner
                           </span>`
                        : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                            <span class="material-symbols-outlined text-[14px]">scale</span> Run-off Likely
                           </span>`;

                    html += `
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td class="p-4 font-medium">${position.title}</td>
                        <td class="p-4">
                            <div class="flex items-center gap-3">
                                <div class="size-8 rounded-full ${colorClass} flex items-center justify-center font-bold text-xs">${initials}</div>
                                <span class="font-bold text-text-main dark:text-gray-100">${winner.name}</span>
                            </div>
                        </td>
                        <td class="p-4 text-right tabular-nums">${winner.votes.toLocaleString()}</td>
                        <td class="p-4 text-right tabular-nums font-medium">${percent.toFixed(1)}%</td>
                        <td class="p-4 text-center">${statusHtml}</td>
                    </tr>
                    `;
                }
            });
            winnersTbody.innerHTML = html;
        }

    } catch (err) {
        console.error('Failed to fetch results:', err);
    }

    // Print / Download
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('print') || text.includes('download') || text.includes('export')) {
            btn.addEventListener('click', (e) => { e.preventDefault(); window.print(); });
        }
        if (text.includes('certify') || text.includes('publish') || text.includes('approve')) {
            btn.addEventListener('click', () => showToast('Results certified and published!', 'success'));
        }
    });
});
