'use strict';

/**
 * HAYAGRIVA Component Loader
 * Asynchronously loads shared components (e.g. footer.html) into target containers.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const footerContainer = document.getElementById('site-footer');
    if (footerContainer) {
        try {
            const res = await fetch('/components/footer.html?v=' + Date.now());
            if (res.ok) {
                const html = await res.text();
                footerContainer.innerHTML = html;
            } else {
                console.error('[HAYAGRIVA Components] Failed to fetch /components/footer.html (Status:', res.status, ')');
            }
        } catch (err) {
            console.error('[HAYAGRIVA Components] Error loading footer:', err.message);
        }
    }
});
