// Profile Page Logic
document.addEventListener('DOMContentLoaded', async () => {
    createStudentNav('profile');
    const session = requireStudentAuth();
    if (!session) return;

    // Fetch profile from API
    try {
        const user = await apiCall('/auth/profile/');
        setSession(user);

        // Update displayed name
        document.querySelectorAll('h2, h3, h4, p, span').forEach(el => {
            if (el.textContent.includes('John Doe') || el.textContent.includes('Student Name')) {
                el.textContent = el.textContent.replace(/John Doe|Student Name/g, user.name);
            }
        });

        // Update name on profile card and ID card
        const nameEl = document.querySelector('h1');
        if (nameEl) nameEl.textContent = user.name;

        // Update matric
        document.querySelectorAll('span, p, div').forEach(el => {
            if (el.textContent.trim() === '19/0874' || el.textContent.includes('MAT/')) {
                el.textContent = el.textContent.replace(/19\/0874|MAT\/\S+/g, user.matric);
            }
        });

        // Update department
        document.querySelectorAll('span, p, div').forEach(el => {
            if (el.textContent.trim() === 'Computer Science' && user.department) {
                el.textContent = user.department;
            }
        });

        // Update verification status section
        const verifyStatus = document.getElementById('verification-status');
        const eligibilityStatus = document.getElementById('eligibility-status');
        const verifyAction = document.getElementById('verify-action');

        if (user.is_verified) {
            // Verified - show green check
            if (verifyStatus) verifyStatus.innerHTML = '<span class="material-symbols-outlined text-green-500 text-[20px]">check_circle</span> Verified';
            if (eligibilityStatus) eligibilityStatus.innerHTML = '<span class="material-symbols-outlined text-green-500 text-[20px]">check_circle</span> Eligible to Vote';

        } else {
            // Not verified - show warning + verify button
            if (verifyStatus) verifyStatus.innerHTML = '<span class="material-symbols-outlined text-amber-500 text-[20px]">warning</span> Not Verified';
            if (eligibilityStatus) eligibilityStatus.innerHTML = '<span class="material-symbols-outlined text-amber-500 text-[20px]">block</span> Not Eligible';
            if (verifyAction) verifyAction.classList.remove('hidden');
        }

    } catch (err) {
        console.error('Failed to fetch profile:', err);
    }

    // Edit profile button
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.toLowerCase().includes('edit')) {
            btn.addEventListener('click', () => showToast('Profile editing coming soon', 'info'));
        }
    });

    // Account action buttons
    document.querySelectorAll('div[class*="cursor-pointer"], button, a').forEach(el => {
        const text = el.textContent.trim().toLowerCase();
        if (text === 'log out' || text === 'logout') {
            el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
        } else if (text.includes('change password')) {
            el.addEventListener('click', () => showToast('Password change coming soon', 'info'));
        } else if (text.includes('notification')) {
            el.addEventListener('click', () => showToast('Notification settings coming soon', 'info'));
        }
    });

    // Logout
    document.querySelectorAll('a, button').forEach(el => {
        const text = el.textContent.trim().toLowerCase();
        if (text.includes('log out') || text.includes('logout') || text.includes('sign out')) {
            el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
            if (el.tagName === 'A') el.href = '#';
        }
    });
});
