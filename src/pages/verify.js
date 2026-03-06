// Verify Page Logic
document.addEventListener('DOMContentLoaded', () => {
    createStudentNav('verify');
    const session = requireStudentAuth();
    if (!session) return;

    // Find all buttons on the page
    const allButtons = Array.from(document.querySelectorAll('button'));

    // The big yellow capture button (circle with yellow inner circle)
    const captureBtn = document.querySelector('button.group') ||
        allButtons.find(b => b.querySelector('div[class*="bg-[#F5B400]"][class*="rounded-full"]'));

    // Upload button
    const uploadBtn = allButtons.find(b => b.textContent.includes('Upload'));

    // Handle capture button click
    if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
            // Visual feedback - scanning animation
            showToast('Scanning your Student ID...', 'info');
            captureBtn.disabled = true;
            captureBtn.style.opacity = '0.5';

            // Simulate scan delay for realism
            await new Promise(r => setTimeout(r, 2000));

            try {
                const data = await apiCall('/auth/verify/', { method: 'POST' });

                // Update session storage
                const s = getSession();
                if (s) { s.is_verified = true; setSession(s); }

                showToast('✅ Identity verified successfully!', 'success');

                // Redirect to profile page to see updated status
                setTimeout(() => window.location.href = '/profile.html', 1500);
            } catch (err) {
                showToast(err.message || 'Verification failed. Please try again.', 'error');
                captureBtn.disabled = false;
                captureBtn.style.opacity = '1';
            }
        });
    }

    // Handle upload button  
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            showToast('Processing uploaded ID...', 'info');
            uploadBtn.disabled = true;

            await new Promise(r => setTimeout(r, 2000));

            try {
                const data = await apiCall('/auth/verify/', { method: 'POST' });
                const s = getSession();
                if (s) { s.is_verified = true; setSession(s); }
                showToast('✅ Identity verified successfully!', 'success');
                setTimeout(() => window.location.href = '/profile.html', 1500);
            } catch (err) {
                showToast(err.message || 'Verification failed', 'error');
                uploadBtn.disabled = false;
            }
        });
    }
});
