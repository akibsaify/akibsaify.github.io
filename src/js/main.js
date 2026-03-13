/* ═══════════════════════════════════════════════════════════════
   Deal Drops — main.js
   Minimal JS: mobile nav, copy coupon, copy link, share
═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Mobile Nav Toggle ─────────────────────────────────────────
  const navToggle = document.getElementById("nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const navIcon   = document.getElementById("nav-icon");

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = mobileNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navIcon.textContent = isOpen ? "✕" : "☰";
    });

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (!navToggle.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navIcon.textContent = "☰";
      }
    });
  }

  // ── Copy Coupon Code ──────────────────────────────────────────
  const copyBtn = document.getElementById("copy-coupon-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      const code = this.dataset.code;
      copyToClipboard(code, this, "Copy Code", "Copied! ✓");
    });
  }

  // ── Copy Page Link ────────────────────────────────────────────
  const copyLinkBtn = document.getElementById("copy-link-btn");
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", function () {
      const url = this.dataset.url || window.location.href;
      copyToClipboard(url, this, "🔗 Copy Link", "✓ Copied!");
    });
  }

  // ── Shared copy helper ────────────────────────────────────────
  function copyToClipboard(text, btn, originalText, successText) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopied(btn, successText, originalText);
      }).catch(function () {
        fallbackCopy(text, btn, originalText, successText);
      });
    } else {
      fallbackCopy(text, btn, originalText, successText);
    }
  }

  function fallbackCopy(text, btn, originalText, successText) {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
      showCopied(btn, successText, originalText);
    } catch (_) {}
    document.body.removeChild(el);
  }

  function showCopied(btn, successText, originalText) {
    btn.textContent = successText;
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = originalText;
      btn.classList.remove("copied");
    }, 2000);
  }

  // ── Sort deals grid ───────────────────────────────────────────
  const sortBtns = document.querySelectorAll(".sort-btn");
  const dealsGrid = document.getElementById("deals-grid");

  if (sortBtns.length && dealsGrid) {
    sortBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        sortBtns.forEach(function (b) { b.classList.remove("active"); });
        this.classList.add("active");

        const cards = Array.from(dealsGrid.querySelectorAll(".deal-card"));
        const sortBy = this.dataset.sort;

        cards.sort(function (a, b) {
          if (sortBy === "discount") {
            const discA = parseInt(a.querySelector(".deal-card__discount")?.textContent || "0", 10);
            const discB = parseInt(b.querySelector(".deal-card__discount")?.textContent || "0", 10);
            return discB - discA;
          }
          // default: newest (DOM order is already newest-first from 11ty)
          return 0;
        });

        cards.forEach(function (card) { dealsGrid.appendChild(card); });
      });
    });
  }

  // ── Smooth scroll for anchor links ───────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

})();
