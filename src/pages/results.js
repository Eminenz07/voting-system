// Results Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    createStudentNav('results');
    const session = requireStudentAuth();
    if (!session) return;

    const electionId = localStorage.getItem('au-active-election') || '1';

    // Fetch results from API
    try {
        const data = await apiCall(`/elections/${electionId}/results/`);

        const titleEl = document.getElementById('election-title');
        if (titleEl) titleEl.textContent = data.election?.title || 'Election Results';

        // Update Key Metrics
        const eligibleEl = document.getElementById('metric-eligible');
        if (eligibleEl) {
            // Approximation if eligible voters isn't directly passed
            const eligible = data.eligible_voters || Math.round((data.total_votes / (data.turnout / 100))) || 0;
            eligibleEl.textContent = eligible.toLocaleString();
        }

        const votesEl = document.getElementById('metric-votes');
        if (votesEl) votesEl.textContent = data.total_votes.toLocaleString();

        const turnoutEl = document.getElementById('metric-turnout');
        if (turnoutEl) turnoutEl.textContent = data.turnout.toFixed(1) + '%';

        setTimeout(() => {
            const votesBar = document.getElementById('metric-votes-bar');
            if (votesBar) votesBar.style.width = data.turnout + '%';
        }, 100);

        // Render dynamic candidates
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer && data.positions) {
            let html = '';

            data.positions.forEach(position => {
                html += `
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-slate-900 mb-6 border-b border-neutral-200 pb-2">${position.title}</h3>
                    <div class="flex flex-col gap-6">
                `;

                // Sort candidates by votes
                const sortedCandidates = [...position.candidates].sort((a, b) => b.votes - a.votes);
                const colors = ['bg-primary', 'bg-neutral-500', 'bg-neutral-400', 'bg-neutral-300'];

                sortedCandidates.forEach((cand, idx) => {
                    const colorClass = colors[idx] || colors[colors.length - 1];
                    const widthPercent = cand.percentage || 0;

                    html += `
                    <div class="group">
                        <div class="flex items-end justify-between mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                                    <img alt="Candidate" class="w-full h-full object-cover" src="${cand.photo_url || 'https://via.placeholder.com/150'}"/>
                                </div>
                                <div>
                                    <p class="font-bold text-slate-900 group-hover:text-primary transition-colors">${cand.name}</p>
                                    <p class="text-xs text-neutral-500">${cand.party || 'Independent'}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-bold text-slate-900">${cand.votes.toLocaleString()}</p>
                                <p class="text-xs font-bold ${idx === 0 ? 'text-primary' : 'text-neutral-500'}">${widthPercent.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div class="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
                            <div class="${colorClass} h-full rounded-full transition-all duration-1000 ease-out w-0 candidate-bar" data-width="${widthPercent}%"></div>
                        </div>
                    </div>
                    `;
                });

                html += `</div></div>`;
            });

            resultsContainer.innerHTML = html;

            // Animate candidate result bars
            setTimeout(() => {
                document.querySelectorAll('.candidate-bar').forEach(bar => {
                    bar.style.width = bar.getAttribute('data-width');
                });
            }, 100);
        }

    } catch (err) {
        console.error('Failed to fetch results:', err);
        const titleEl = document.getElementById('election-title');
        if (titleEl) titleEl.textContent = 'Results Unavailable';
    }

    // Print button
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('print') || text.includes('download')) {
            btn.addEventListener('click', (e) => { e.preventDefault(); window.print(); });
        }
    });

    // Chart / Table toggle
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('chart') || text.includes('table') || text.includes('graph')) {
            btn.addEventListener('click', () => showToast('View toggled', 'info'));
        }
    });

    // Logout
    document.querySelectorAll('a, button').forEach(el => {
        const text = el.textContent.trim().toLowerCase();
        if (text.includes('log out') || text.includes('logout')) {
            el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
            if (el.tagName === 'A') el.href = '#';
        }
    });
});
