/* =========================================================================
   Avi Wagner — portfolio
   Vanilla JS, no dependencies. Every feature degrades gracefully:
   if this file fails to load, the page is still fully readable.
   ========================================================================= */

(function() {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Theme ------------------------------------------------------
       The inline script in <head> has already applied any stored preference,
       so this only has to handle toggling and keeping the label honest. */

    var themeToggle = document.getElementById('themeToggle');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function currentTheme() {
        return root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
    }

    function syncThemeLabel() {
        if (!themeToggle) return;
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        themeToggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
        themeToggle.setAttribute('title', 'Switch to ' + next + ' theme');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var next = currentTheme() === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            syncThemeLabel();
        });
        syncThemeLabel();
    }

    // Follow the OS while the user has not made an explicit choice.
    var onSystemChange = function() { if (!root.getAttribute('data-theme')) syncThemeLabel(); };
    if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);


    /* ---------- Mobile navigation ----------------------------------------- */

    var navToggle = document.getElementById('navToggle');
    var navPanel = document.getElementById('navPanel');

    function closeNav() {
        if (!navPanel || !navToggle) return;
        navPanel.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation');
    }

    if (navToggle && navPanel) {
        navToggle.addEventListener('click', function() {
            var open = navPanel.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(open));
            navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        });

        navPanel.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', closeNav);
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeNav();
        });

        document.addEventListener('click', function(e) {
            if (!navPanel.classList.contains('is-open')) return;
            if (navPanel.contains(e.target) || navToggle.contains(e.target)) return;
            closeNav();
        });
    }


    /* ---------- Header shadow on scroll ----------------------------------- */

    var header = document.getElementById('siteHeader');
    if (header) {
        var ticking = false;
        var updateHeader = function() {
            header.classList.toggle('is-stuck', window.scrollY > 8);
            ticking = false;
        };
        window.addEventListener('scroll', function() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateHeader);
        }, { passive: true });
        updateHeader();
    }


    /* ---------- Scroll reveal --------------------------------------------- */

    var revealEls = document.querySelectorAll('.reveal');

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function(el) { el.classList.add('is-visible'); });
    } else {
        var revealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

        revealEls.forEach(function(el, i) {
            // Stagger siblings slightly so groups cascade instead of popping together.
            var prev = el.previousElementSibling;
            if (prev && prev.classList.contains('reveal')) {
                el.style.transitionDelay = Math.min(i % 5, 4) * 60 + 'ms';
            }
            revealObserver.observe(el);
        });
    }


    /* ---------- Active navigation link ------------------------------------ */

    var sections = document.querySelectorAll('main section[id]');
    var navLinks = document.querySelectorAll('.nav-link');

    if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
        var visible = new Map();

        var sectionObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
            });

            var bestId = null;
            var bestRatio = 0;
            visible.forEach(function(ratio, id) {
                if (ratio > bestRatio) { bestRatio = ratio;
                    bestId = id; }
            });

            navLinks.forEach(function(link) {
                link.classList.toggle(
                    'is-active',
                    bestId !== null && link.getAttribute('href') === '#' + bestId
                );
            });
        }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] });

        sections.forEach(function(s) { sectionObserver.observe(s); });
    }


    /* ---------- Project cards -------------------------------------------
     Expansion is native <details>/<summary>; the chevron and the
     "Read more / Hide details" label are handled in CSS. Nothing to do here
     beyond opening every panel before printing. */

  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('.project').forEach(function (d) {
      if (!d.open) { d.dataset.wasClosed = '1'; d.open = true; }
    });
  });
  window.addEventListener('afterprint', function () {
    document.querySelectorAll('.project[data-was-closed]').forEach(function (d) {
      d.open = false;
      delete d.dataset.wasClosed;
    });
  });


  /* ---------- Portrait fallback ----------------------------------------- */

    var portrait = document.getElementById('portraitImg');
    if (portrait) {
        var showFallback = function() {
            var figure = portrait.closest('.portrait');
            if (figure) figure.classList.add('no-image');
        };
        portrait.addEventListener('error', showFallback);
        // Catch an image that already failed before this script ran.
        if (portrait.complete && portrait.naturalWidth === 0) showFallback();
    }


    /* ---------- Copy email ------------------------------------------------ */

    var copyBtn = document.getElementById('copyEmail');
    if (copyBtn && navigator.clipboard) {
        copyBtn.addEventListener('click', function() {
            navigator.clipboard.writeText(copyBtn.dataset.copy || '').then(function() {
                copyBtn.textContent = 'Copied';
                copyBtn.classList.add('is-copied');
                setTimeout(function() {
                    copyBtn.textContent = 'Copy';
                    copyBtn.classList.remove('is-copied');
                }, 1800);
            }).catch(function() {
                copyBtn.textContent = 'Press ⌘C';
                setTimeout(function() { copyBtn.textContent = 'Copy'; }, 1800);
            });
        });
    } else if (copyBtn) {
        copyBtn.hidden = true;
    }


    /* ---------- Footer year ----------------------------------------------- */

    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

})();