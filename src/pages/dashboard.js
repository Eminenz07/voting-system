// Dashboard Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    createStudentNav('dashboard');
    const session = requireStudentAuth();
    if (!session) return;

    // Fetch fresh user data from API
    try {
        const user = await apiCall('/auth/me/');
        setSession(user);

        // Update student name in welcome message
        document.querySelectorAll('h2, h3, .text-2xl, .text-3xl').forEach(el => {
            if (el.textContent.includes('John') || el.textContent.includes('Welcome')) {
                el.innerHTML = el.innerHTML.replace(/John/g, user.first_name);
            }
        });

        // Update matric number display
        document.querySelectorAll('span, p').forEach(el => {
            if (el.textContent.includes('19/0234') || el.textContent.includes('Matric:')) {
                el.textContent = el.textContent.replace(/19\/0234/, user.matric);
            }
        });

        // Update name displays
        document.querySelectorAll('span, p, div').forEach(el => {
            if (el.textContent.trim() === 'John Doe') {
                el.textContent = user.name;
            }
        });

        // Update Voting Status
        const statusEl = document.getElementById('dashboard-voting-status');
        const iconEl = document.getElementById('dashboard-voting-icon');
        const bgEl = document.getElementById('dashboard-voting-bg');
        if (statusEl && iconEl && bgEl) {
            if (user.is_verified) {
                statusEl.innerHTML = `<span class="material-symbols-outlined filled text-xl" style="font-variation-settings: 'FILL' 1;">check_circle</span> Eligible`;
                statusEl.className = 'mt-2 text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2';
                bgEl.className = 'flex h-12 w-12 items-center justify-center rounded-full bg-accent-light dark:bg-accent/10 text-green-600 dark:text-green-400';
            } else {
                statusEl.innerHTML = `<span class="material-symbols-outlined filled text-xl" style="font-variation-settings: 'FILL' 1;">error</span> Unverified`;
                statusEl.className = 'mt-2 text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2';
                bgEl.className = 'flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
            }
        }
    } catch (err) {
        console.error('Failed to fetch user data:', err);
    }

    // Fetch active elections from API
    try {
        const elections = await apiCall('/elections/');
        // Store the first active election ID for ballot page
        const activeElection = elections.find(e => e.status === 'active');
        if (activeElection) {
            localStorage.setItem('au-active-election', activeElection.id);
        }

        // Populate Dashboard Elections Container
        const container = document.getElementById('dashboard-elections-container');
        if (container) {
            if (elections.length === 0) {
                container.innerHTML = `
                    <div class="p-8 text-center bg-slate-50 dark:bg-surface-dark/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                        <p class="text-slate-500 font-medium">No active elections at the moment.</p>
                    </div>
                `;
            } else {
                // Showing only the first 2 active elections for the dashboard summary
                container.innerHTML = elections.slice(0, 2).map(election => `
                    <div class="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-white dark:bg-surface-dark p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 transition-all hover:shadow-md hover:ring-primary/20 dark:hover:ring-primary/40">
                        <div class="flex flex-col sm:flex-row gap-6">
                            <div class="flex flex-1 flex-col justify-between">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                            ${election.status === 'active' ? 'Active Now' : election.status}
                                        </span>
                                    </div>
                                    <h4 class="text-xl font-bold text-slate-900 dark:text-white">${election.title}</h4>
                                    <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                        ${election.description || 'Participate in this election to shape the future of Adeleke University.'}
                                    </p>
                                </div>
                                <div class="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <span class="material-symbols-outlined text-base">how_to_vote</span>
                                        <span>Voting is Open</span>
                                    </div>
                                    <a href="/elections.html" class="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#003DA5]/20 hover:bg-primary-dark hover:shadow-xl transition-all">
                                        Vote Now
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Failed to fetch elections:', err);
        const container = document.getElementById('dashboard-elections-container');
        if (container) {
            container.innerHTML = `
                <div class="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-800 text-red-600">
                    <span class="material-symbols-outlined text-4xl mb-2">error</span>
                    <p class="font-medium">Failed to load active elections. Please refresh the page.</p>
                </div>
            `;
        }
    }

    // Helper for Toast/Alert
    function showToast(message) {
        alert(message); // Simple alert for now
    }

    // Fix sidebar navigation links (if any remain)
    const sidebarLinks = {
        'Home': '/dashboard.html',
        'Elections': '/elections.html',
        'Results': '/results.html',
        'Profile': '/profile.html',
        'Settings': '/profile.html',
    };
    document.querySelectorAll('aside a, nav a').forEach(a => {
        const text = a.textContent.trim();
        if (sidebarLinks[text]) a.href = sidebarLinks[text];
    });

    // Wire up all buttons and interactive elements
    document.querySelectorAll('a, button, .cursor-pointer').forEach(el => {
        const text = el.textContent.trim().toLowerCase();

        // Navigation: Vote / View Elections
        if (text.includes('vote now') || text === 'vote' || text.includes('view all')) {
            el.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/elections.html'; });
            if (el.tagName === 'A') el.href = '/elections.html';
        }

        // Navigation: Quick Actions
        else if (text.includes('verify eligibility') || text.includes('eligible')) {
            el.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/verify.html'; });
            if (el.tagName === 'A') el.href = '/verify.html';
        }

        // Actions: Support & Chat 
        else if (text.includes('support') || text.includes('chat now') || text.includes('report an issue') || el.querySelector('.material-symbols-outlined')?.textContent.includes('chat')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                showToast("Connecting to Student Support... (Chat feature coming soon!)");
            });
            if (el.tagName === 'A') el.href = '#';
        }

        // Actions: Notifications
        else if (el.querySelector('.material-symbols-outlined')?.textContent.includes('notifications')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                showToast("You have 0 new notifications.");
            });
        }

        // Actions: Set Reminder
        else if (text.includes('set reminder')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                showToast("Reminder added to your calendar!");
                el.textContent = "Reminder Set";
                el.classList.add('bg-green-50', 'text-green-600', 'border-green-200');
            });
        }

        // Actions: Electoral Laws & Guidelines
        else if (text.includes('electoral laws')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                showToast("Downloading AUEC Official Electoral Guidelines PDF...");
            });
        }

        // News Items (elements with cursor-pointer)
        else if (el.classList.contains('cursor-pointer') &&
            !el.closest('header') &&
            !el.closest('#floating-nav') &&
            el.id !== 'nav-toggle' &&
            el.id !== 'dark-mode-toggle') {
            el.addEventListener('click', (e) => {
                // Double check we haven't clicked inside the nav menu accidentally
                if (e.target.closest('#floating-nav') || e.target.closest('#nav-toggle') || e.target.closest('#dark-mode-toggle')) return;

                e.preventDefault();
                showToast("Opening full news article...");
            });
        }

        // Logout button
        if (text.includes('log out') || text.includes('logout') || text.includes('sign out')) {
            el.addEventListener('click', (e) => { e.preventDefault(); window.logout(); });
            if (el.tagName === 'A') el.href = '#';
        }
    });
});
