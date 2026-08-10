/**
 * HAYAGRIVA Portal — Shared Mobile Responsive JS
 * Handles: hamburger nav, IDE filter drawer, scrim
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ── Hamburger nav ──────────────────────────────── */
    const hamburger = document.getElementById('navHamburger');
    const mobileDrawer = document.getElementById('navMobileDrawer');

    if (hamburger && mobileDrawer) {
      hamburger.addEventListener('click', function () {
        const isOpen = mobileDrawer.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });

      // Close drawer when a link is clicked
      mobileDrawer.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          mobileDrawer.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });

      // Close when clicking outside
      document.addEventListener('click', function (e) {
        if (!hamburger.contains(e.target) && !mobileDrawer.contains(e.target)) {
          mobileDrawer.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ── IDE Filter Drawer (panel-left) ─────────────── */
    const filterToggle = document.getElementById('filterDrawerToggle');
    const panelLeft    = document.querySelector('.panel-left');
    const scrim        = document.getElementById('panelScrim');

    function openFilterDrawer() {
      if (panelLeft) panelLeft.classList.add('open');
      if (scrim)     scrim.classList.add('visible');
    }

    function closeFilterDrawer() {
      if (panelLeft) panelLeft.classList.remove('open');
      if (scrim)     scrim.classList.remove('visible');
    }

    if (filterToggle) {
      filterToggle.addEventListener('click', openFilterDrawer);
    }

    if (scrim) {
      scrim.addEventListener('click', closeFilterDrawer);
    }

    // Also close when a tag-item is clicked (filter applied)
    if (panelLeft) {
      panelLeft.addEventListener('click', function (e) {
        if (e.target.closest('.tag-item') && window.innerWidth <= 768) {
          setTimeout(closeFilterDrawer, 200);
        }
      });
    }
  });
})();
