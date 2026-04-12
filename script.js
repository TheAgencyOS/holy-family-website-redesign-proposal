/*
  HFU Proposal Site: progressive enhancement
  Vanilla JS, no dependencies, under 200 lines.
  Features: scroll spy, smooth scroll, mobile nav toggle, reduced-motion respect.
*/
(function () {
  "use strict";

  // Reduced motion preference: checked live so OS setting changes take effect.
  var reducedMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReducedMotion = function () { return reducedMotionMQ.matches; };

  // Mobile breakpoint: 48em. Checked live for responsive behavior.
  var mobileMQ = window.matchMedia("(max-width: 48em)");

  var sidebar = document.querySelector(".sidebar-nav");
  var sidebarLinks = Array.prototype.slice.call(
    document.querySelectorAll(".sidebar-nav__link")
  );
  var sections = Array.prototype.slice.call(
    document.querySelectorAll(".section[id]")
  );

  // Build a lookup from section id to sidebar link for scroll spy marking.
  var linkById = sidebarLinks.reduce(function (acc, link) {
    var href = link.getAttribute("href") || "";
    if (href.charAt(0) === "#") {
      acc[href.slice(1)] = link;
    }
    return acc;
  }, {});

  // Scroll spy: highlight the sidebar link whose section is most visible.
  function initScrollSpy() {
    if (!("IntersectionObserver" in window) || sections.length === 0) {
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = linkById[entry.target.id];
          if (!link) { return; }
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            sidebarLinks.forEach(function (other) {
              other.classList.remove("sidebar-nav__link--active");
              other.removeAttribute("aria-current");
            });
            link.classList.add("sidebar-nav__link--active");
            link.setAttribute("aria-current", "true");
          }
        });
      },
      { threshold: [0.5] }
    );
    sections.forEach(function (section) { observer.observe(section); });
  }

  // Smooth scroll on sidebar click. Falls back to native jump if reduced motion.
  function initSmoothScroll() {
    sidebarLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href") || "";
        if (href.charAt(0) !== "#") { return; }
        var target = document.getElementById(href.slice(1));
        if (!target) { return; }
        if (prefersReducedMotion()) { return; }
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Move focus for keyboard users without causing a second scroll.
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        if (mobileMQ.matches) { closeMobileNav(); }
      });
    });
  }

  // Mobile nav toggle: inject a hamburger button, manage open/close state.
  var toggleButton = null;

  function createToggleButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "sidebar-nav-region");
    btn.setAttribute("aria-label", "Open proposal navigation");
    btn.innerHTML = '<span class="nav-toggle__bar" aria-hidden="true"></span><span class="nav-toggle__bar" aria-hidden="true"></span><span class="nav-toggle__bar" aria-hidden="true"></span>';
    btn.addEventListener("click", function () {
      if (sidebar && sidebar.classList.contains("sidebar-nav--open")) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
    return btn;
  }

  function openMobileNav() {
    if (!sidebar || !toggleButton) { return; }
    sidebar.classList.add("sidebar-nav--open");
    toggleButton.setAttribute("aria-expanded", "true");
    toggleButton.setAttribute("aria-label", "Close proposal navigation");
    document.addEventListener("keydown", onKeydownTrap);
    // Focus the first link so keyboard users land inside the opened panel.
    var firstLink = sidebar.querySelector(".sidebar-nav__link");
    if (firstLink) { firstLink.focus(); }
  }

  function closeMobileNav() {
    if (!sidebar || !toggleButton) { return; }
    sidebar.classList.remove("sidebar-nav--open");
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.setAttribute("aria-label", "Open proposal navigation");
    document.removeEventListener("keydown", onKeydownTrap);
    toggleButton.focus();
  }

  // Focus trap: keep Tab cycling inside the sidebar while mobile nav is open.
  function onKeydownTrap(event) {
    if (event.key === "Escape") {
      closeMobileNav();
      return;
    }
    if (event.key !== "Tab" || !sidebar) { return; }
    var focusables = sidebar.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) { return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Inject the toggle button only on mobile; remove on desktop resize.
  function syncMobileToggle() {
    if (mobileMQ.matches) {
      if (!toggleButton) {
        toggleButton = createToggleButton();
        document.body.insertBefore(toggleButton, document.body.firstChild);
      }
      if (sidebar) { sidebar.setAttribute("id", "sidebar-nav-region"); }
    } else {
      if (toggleButton && toggleButton.parentNode) {
        toggleButton.parentNode.removeChild(toggleButton);
        toggleButton = null;
      }
      if (sidebar) { sidebar.classList.remove("sidebar-nav--open"); }
      document.removeEventListener("keydown", onKeydownTrap);
    }
  }

  // Bootstrap once the DOM is ready.
  function init() {
    initScrollSpy();
    initSmoothScroll();
    syncMobileToggle();
    if (typeof mobileMQ.addEventListener === "function") {
      mobileMQ.addEventListener("change", syncMobileToggle);
    } else if (typeof mobileMQ.addListener === "function") {
      mobileMQ.addListener(syncMobileToggle);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
