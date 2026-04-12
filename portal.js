// ═══════════════════════════════════════════════════════════════════
// PORTAL.JS · shared client-side behavior for all portal tabs
// Loaded by: mockups.html, research.html, technical.html
// index.html (Proposal) has its own inline script for page-anchor tracking
// ═══════════════════════════════════════════════════════════════════
(function () {
  // Close mobile drawer on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.body.classList.remove('nav-open');
    }
  });

  // Close mobile drawer when any link inside the sidebar is clicked
  document.querySelectorAll('.site-nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.body.classList.remove('nav-open');
    });
  });

  // Hide the keyboard hint (if present) after 6 seconds
  setTimeout(function () {
    var hint = document.querySelector('.site-keyhint');
    if (hint) hint.classList.add('is-hidden');
  }, 6000);
})();
