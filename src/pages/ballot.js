// Ballot Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    createStudentNav('ballot');
    const session = requireStudentAuth();
    if (!session) return;

    let selections = JSON.parse(sessionStorage.getItem('au-ballot-selections') || '{}');
    const electionId = localStorage.getItem('au-active-election') || '1';
    let currentBallot = null;
    let activePositionIndex = 0;

    // Fetch ballot data from API
    try {
        currentBallot = await apiCall(`/elections/${electionId}/ballot/`);
        if (currentBallot.has_voted) {
            showToast('You have already voted in this election.', 'info');
        }
        // Store positions data for the confirmation page
        localStorage.setItem('au-ballot-data', JSON.stringify(currentBallot));

        if (currentBallot.positions && currentBallot.positions.length > 0) {
            renderTabs();
            renderPosition(0);
        } else {
            document.getElementById('position-title').textContent = "No Positions Available";
            document.getElementById('position-desc').textContent = "This election has no positions created yet.";
        }
    } catch (err) {
        console.error('Failed to fetch ballot:', err);
        document.getElementById('position-title').textContent = "Error Loading Ballot";
        document.getElementById('position-desc').textContent = "Failed to communicate with the server.";
    }

    function renderTabs() {
        const tabsContainer = document.getElementById('ballot-tabs');
        if (!tabsContainer || !currentBallot.positions) return;

        tabsContainer.innerHTML = currentBallot.positions.map((pos, index) => {
            const isActive = index === activePositionIndex;
            const hasSelection = !!selections[pos.title];

            if (isActive) {
                return `
                <a class="border-primary text-primary whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 group cursor-pointer" 
                   onclick="window.switchPosition(${index})">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-1">${index + 1}</span>
                    ${pos.title}
                </a>`;
            } else {
                const badgeColor = hasSelection ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 group-hover:bg-primary/20 group-hover:text-primary';
                const badgeIcon = hasSelection ? '<span class="material-symbols-outlined text-[14px]">check</span>' : (index + 1);
                return `
                <a class="border-transparent text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary/30 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 group transition-colors cursor-pointer" 
                   onclick="window.switchPosition(${index})">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full ${badgeColor} text-xs mr-1 transition-colors">
                        ${badgeIcon}
                    </span>
                    ${pos.title}
                </a>`;
            }
        }).join('') + `
        <span class="flex-1"></span>
        <div class="hidden md:flex items-center text-xs text-slate-500 py-4">
            Step ${activePositionIndex + 1} of ${currentBallot.positions.length}
        </div>
        `;
    }

    function renderPosition(index) {
        if (!currentBallot || !currentBallot.positions || !currentBallot.positions[index]) return;
        activePositionIndex = index;
        const position = currentBallot.positions[index];

        document.getElementById('position-title').textContent = `Vote for ${position.title}`;
        document.getElementById('position-desc').textContent = "Select the candidate who best aligns with your vision for the future.";

        renderTabs(); // Re-render tabs to update active state

        const grid = document.getElementById('candidates-grid');
        if (!grid) return;

        let html = '';
        if (position.candidates && position.candidates.length > 0) {
            html += position.candidates.map((cand, candIndex) => {
                const isSelected = selections[position.title] === cand.name;

                // CSS classes based on selection state
                const cardContainerClass = isSelected
                    ? "border-[#F5B400] shadow-lg shadow-[#F5B400]/10 ring-2 ring-offset-2 ring-primary dark:ring-offset-background-dark bg-primary/5"
                    : "border-neutral-light dark:border-neutral-dark hover:border-primary/50 hover:shadow-md";

                const checkBadgeOpacity = isSelected ? "opacity-100" : "opacity-0";
                const imgGrayscaleClass = isSelected ? "" : "grayscale group-hover:grayscale-0";
                const radioCircleClass = isSelected ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600 group-hover:border-primary";
                const radioDotOpacity = isSelected ? "opacity-100" : "opacity-0 text-white";

                return `
                <label class="relative group cursor-pointer" onclick="window.selectCandidate('${position.title}', '${cand.name.replace(/'/g, "\\'")}')">
                    <input class="peer sr-only" name="${position.id}_vote" type="radio" value="${cand.id}" ${isSelected ? 'checked' : ''}/>
                    <div class="h-full bg-surface-light dark:bg-surface-dark rounded-2xl border-2 ${cardContainerClass} transition-all duration-300 flex flex-col overflow-hidden">
                        <div class="absolute top-4 right-4 z-10 bg-[#F5B400] text-black rounded-full p-1 ${checkBadgeOpacity} transition-opacity duration-200 shadow-sm">
                            <span class="material-symbols-outlined text-xl">check</span>
                        </div>
                        <div class="h-48 w-full bg-slate-100 relative overflow-hidden ${imgGrayscaleClass} transition-all duration-500">
                            <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                                 style="background-image: url('${cand.photo_url || 'https://via.placeholder.com/300?text=No+Photo'}');"></div>
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div class="absolute bottom-4 left-4 text-white">
                                <div class="bg-[#F5B400] text-black backdrop-blur-sm text-xs font-bold px-2 py-1 rounded inline-block mb-1">BALLOT #${(candIndex + 1).toString().padStart(2, '0')}</div>
                            </div>
                        </div>
                        <div class="p-6 flex flex-col flex-grow">
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-1">${cand.name}</h3>
                            <p class="text-sm font-medium text-primary mb-4">${cand.party || 'Independent'}</p>
                            <p class="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                                "${cand.bio || 'I promise to serve the student body with integrity and diligence.'}"
                            </p>
                            <div class="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button class="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors group/link" type="button">
                                    <span class="material-symbols-outlined text-lg">article</span>
                                    Read Full Manifesto
                                </button>
                                <div class="h-6 w-6 rounded-full border-2 ${radioCircleClass} flex items-center justify-center transition-colors">
                                    <div class="h-2.5 w-2.5 rounded-full bg-white ${radioDotOpacity}"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </label>
                `;
            }).join('');
        }

        const isAbstain = selections[position.title] === 'Abstain';
        const abstainClass = isAbstain ? "border-primary bg-primary/5 text-primary" : "border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800";

        html += `
        <label class="relative group cursor-pointer md:col-span-2 lg:col-span-3" onclick="window.selectCandidate('${position.title}', 'Abstain')">
            <input class="peer sr-only" name="${position.id}_vote" type="radio" value="abstain" ${isAbstain ? 'checked' : ''}/>
            <div class="bg-transparent border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 transition-colors ${abstainClass}">
                <span class="material-symbols-outlined">block</span>
                <span class="font-bold">I wish to abstain from voting for ${position.title}</span>
            </div>
        </label>
        `;

        grid.innerHTML = html;

        // Update summary footer
        const selectionMadeContainer = document.querySelector('.fixed.bottom-0 .hidden.sm\\:block');
        if (selectionMadeContainer) {
            const selectedName = selections[position.title];
            if (selectedName) {
                selectionMadeContainer.innerHTML = `Selection made: <span class="font-bold text-primary">${selectedName}</span>`;
            } else {
                selectionMadeContainer.innerHTML = `No selection made yet`;
            }
        }
    }

    // Global methods for inline handlers
    window.switchPosition = (index) => {
        renderPosition(index);
    };

    window.selectCandidate = (positionTitle, candidateName) => {
        selections[positionTitle] = candidateName;
        sessionStorage.setItem('au-ballot-selections', JSON.stringify(selections));
        renderPosition(activePositionIndex); // Re-render to update UI state
    };

    // Submitting or Reviewing Ballot
    document.querySelectorAll('.fixed.bottom-0 button').forEach(el => {
        const text = el.textContent.trim().toLowerCase();

        if (text.includes('review') || text.includes('next') || text.includes('proceed') || text.includes('confirm')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                if (Object.keys(selections).length === 0) {
                    showToast('Please select at least one candidate before proceeding', 'error');
                    return;
                }
                window.location.href = '/confirmation.html';
            });
        }

        if (text.includes('back') || text.includes('previous')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                if (activePositionIndex > 0) {
                    window.switchPosition(activePositionIndex - 1);
                } else {
                    window.location.href = '/elections.html';
                }
            });
        }
    });
});
