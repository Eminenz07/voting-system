// Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', async () => {
    createAdminNav('admin');
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

    // Fetch dashboard KPIs from API
    try {
        const data = await apiCall('/admin/dashboard/');

        // Update admin name
        document.querySelectorAll('span, p, h3, h4').forEach(el => {
            if (el.textContent.includes('Dr. Adebayo')) {
                el.textContent = el.textContent.replace('Dr. Adebayo', session.name);
            }
        });

        // Update KPI cards with real data
        const kpiMap = {
            '12,450': data.total_students?.toLocaleString(),
            '12450': data.total_students?.toLocaleString(),
            '8,234': data.verified_students?.toLocaleString(),
            '3': data.active_elections?.toString(),
        };

        document.querySelectorAll('h3, .text-3xl, .text-4xl, .text-2xl').forEach(el => {
            const text = el.textContent.trim().replace(/,/g, '');
            for (const [key, value] of Object.entries(kpiMap)) {
                if (text === key.replace(/,/g, '') && value) {
                    el.textContent = value;
                    break;
                }
            }
        });

        // Update total votes
        document.querySelectorAll('h3, .text-3xl, .text-4xl').forEach(el => {
            const text = el.textContent.trim().replace(/,/g, '');
            if (text === '24567' || text === '24,567') {
                el.textContent = data.total_votes?.toLocaleString() || '0';
            }
        });

        // Render Active Elections Table
        const electionsTableBody = document.querySelector('tbody.divide-y');
        if (electionsTableBody && data.recent_elections && data.recent_elections.length > 0) {
            electionsTableBody.innerHTML = data.recent_elections.map(election => {
                const startDate = new Date(election.start_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                const endDate = new Date(election.end_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

                // Determine status pill formatting
                let statusHtml = '';
                if (election.status === 'active') {
                    statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <span class="size-1.5 rounded-full bg-green-500 animate-pulse"></span>Live</span>`;
                } else if (election.status === 'completed') {
                    statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Completed</span>`;
                } else {
                    statusHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Upcoming</span>`;
                }

                return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td class="p-4 pl-6">
                        <div class="flex items-center gap-3">
                            <div class="size-8 rounded bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center">
                                <span class="material-symbols-outlined text-lg">how_to_vote</span>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-slate-900 dark:text-white">${election.title}</p>
                                <p class="text-xs text-text-secondary w-48 truncate">${election.description || 'General Election'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="p-4 text-sm text-slate-600 dark:text-slate-300">${startDate}</td>
                    <td class="p-4 text-sm text-slate-600 dark:text-slate-300">${endDate}</td>
                    <td class="p-4">
                        <span class="text-sm font-medium text-slate-900 dark:text-white">ID: ${election.id}</span>
                    </td>
                    <td class="p-4">${statusHtml}</td>
                    <td class="p-4 pr-6 text-right">
                        <button onclick="window.location.href='/monitoring.html'" class="text-primary hover:text-blue-700 transition-colors p-1" title="Monitor">
                            <span class="material-symbols-outlined">visibility</span>
                        </button>
                    </td>
                </tr>
                `;
            }).join('');
        }

        // Render Recent Activity (Mocked for now since API doesn't have an activity endpoint yet, but UI is dynamic)
        const activityFeed = document.querySelector('.overflow-y-auto.pr-2.space-y-6');
        if (activityFeed) {
            const activities = [
                { title: 'Dashboard Accessed', desc: `Admin ${session.name} logged in.`, time: 'Just now', icon: 'login', color: 'bg-primary' },
                { title: 'Data Synced', desc: 'Real-time dashboard data updated via API.', time: 'Just now', icon: 'sync', color: 'bg-green-500' }
            ];

            activityFeed.innerHTML = activities.map((act, index) => `
                <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                        <div class="size-8 rounded-full ${act.color}/10 text-${act.color.replace('bg-', '')} flex items-center justify-center relative mt-1">
                             <div class="size-2 rounded-full ${act.color} absolute"></div>
                        </div>
                        ${index !== activities.length - 1 ? '<div class="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-1"></div>' : ''}
                    </div>
                    <div class="pb-2 flex-1">
                        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">${act.title}</p>
                        <p class="text-sm text-text-secondary dark:text-slate-400">${act.desc}</p>
                        <p class="text-xs text-slate-400 mt-1">${act.time}</p>
                    </div>
                </div>
            `).join('');
        }

    } catch (err) {
        console.error('Failed to fetch admin dashboard:', err);
    }
});
