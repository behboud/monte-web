// main script as entry point for all custom scripts
(function () {
  "use strict";

  // Dropdown Menu Toggler For Mobile
  // ----------------------------------------
  /*   const dropdownMenuToggler = document.querySelectorAll(
      ".nav-dropdown > .nav-link",
    );
  
    dropdownMenuToggler.forEach((toggler) => {
      toggler?.addEventListener("click", (e) => {
        e.target.closest(".nav-item").classList.toggle("active");
      });
    }); */

  // scroll event trigger
  // ----------------------------------------
  /*
  let lastKnownScrollPosition = 0;
  let ticking = false;

  function doSomething(scrollPos) {
    const nav = document.querySelector("nav");
    const navHeight = nav.offsetHeight;

    if (scrollPos > navHeight) {
      nav.classList.add("bg-[#ffedce]");
    } else {
      nav.classList.remove("bg-[#ffedce]");
    }
  }

  document.addEventListener("scroll", (event) => {
    lastKnownScrollPosition = window.scrollY;

    if (!ticking) {
      window.setTimeout(() => {
        doSomething(lastKnownScrollPosition);
        ticking = false;
      }, 1000);

      ticking = true;
    }
  });
  */

  // Mmenu plugin
  // ----------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach((link) => {
      link.innerHTML = '<i class="fa fa-envelope"></i>&nbsp;' + link.innerHTML;
    });
    // query the ul under navigation
    const ulUnderNav = document.querySelector("#mymenu");
    if (!ulUnderNav || typeof Mmenu === "undefined") {
      return;
    }
    // remove hidden class from ul under navigation
    ulUnderNav.classList.remove("hidden");
    new Mmenu(
      "#mymenu",
      {
        navbar: {
          title: "Montessorischule Gilching",
        },
        offCanvas: {
          position: "left-front",
        },
      },
      {
        classNames: {
          selected: "active",
        },
        offCanvas: {
          clone: false,
          page: {
            selector: "#page",
          },
        },
      },
    );
  });

  const htmlElement = document.documentElement;
  htmlElement.classList.remove("dark");

  const stickyNavigation = document.querySelector("[data-sticky-navigation]");
  if (stickyNavigation) {
    const updateStickyNavigation = () => {
      stickyNavigation.setAttribute("data-scrolled", window.scrollY > 0 ? "true" : "false");
    };

    updateStickyNavigation();
    window.addEventListener("scroll", updateStickyNavigation, { passive: true });
  }

  const heroSliderElement = document.querySelector(".hero-slider");
  if (heroSliderElement && typeof Swiper !== "undefined") {
    new Swiper(heroSliderElement, {
      effect: "fade",
      loop: true,
      speed: 800,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
    });
  }

  const schuleSliderElement = document.querySelector(".schule-slider");
  if (schuleSliderElement && typeof Swiper !== "undefined") {
    new Swiper(schuleSliderElement, {
      effect: "fade",
      loop: true,
      speed: 800,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
    });
  }

  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    const updateBackToTop = () => {
      const isVisible = window.scrollY > 400;
      backToTop.setAttribute("data-visible", isVisible ? "true" : "false");
      backToTop.setAttribute("aria-hidden", isVisible ? "false" : "true");
      backToTop.tabIndex = isVisible ? 0 : -1;
    };

    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });

    backToTop.addEventListener("click", () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  const donationPopup = document.querySelector("[data-donation-popup]");
  if (donationPopup) {
    const donationOptions = [...donationPopup.querySelectorAll("[data-donation-highlight-option]")];
    const donationPopupStorageKey = "monte-donation-highlight-dismissed";
    let wasDismissed = false;

    try {
      wasDismissed = window.sessionStorage.getItem(donationPopupStorageKey) === "true";
    } catch {
      wasDismissed = false;
    }

    if (donationOptions.length && !wasDismissed) {
      const selectedOption = donationOptions[Math.floor(Math.random() * donationOptions.length)];
      const dialog = donationPopup.querySelector('[role="dialog"]');
      const selectedTitle = selectedOption.querySelector("h2[id]");
      const closeButton = donationPopup.querySelector("[data-donation-popup-close]");
      const dismissButton = donationPopup.querySelector("[data-donation-popup-dismiss]");

      donationOptions.forEach((option) => {
        option.hidden = option !== selectedOption;
      });
      if (dialog && selectedTitle) {
        dialog.setAttribute("aria-labelledby", selectedTitle.id);
      }

      donationPopup.removeAttribute("hidden");
      donationPopup.setAttribute("aria-hidden", "true");

      const closeDonationPopup = () => {
        donationPopup.setAttribute("data-open", "false");
        donationPopup.setAttribute("aria-hidden", "true");
        document.body.classList.remove("donation-popup-open");
        try {
          window.sessionStorage.setItem(donationPopupStorageKey, "true");
        } catch {
          // The popup remains dismissible when session storage is unavailable.
        }
        document.removeEventListener("keydown", handleKeydown);
        window.setTimeout(() => donationPopup.setAttribute("hidden", ""), 220);
      };

      const handleKeydown = (event) => {
        if (event.key === "Escape") {
          closeDonationPopup();
        }
      };

      closeButton?.addEventListener("click", closeDonationPopup);
      dismissButton?.addEventListener("click", closeDonationPopup);
      document.addEventListener("keydown", handleKeydown);

      window.requestAnimationFrame(() => {
        donationPopup.setAttribute("data-open", "true");
        donationPopup.setAttribute("aria-hidden", "false");
        document.body.classList.add("donation-popup-open");
        closeButton?.focus({ preventScroll: true });
      });
    }
  }

  const mobileToc = document.querySelector("[data-mobile-toc]");
  if (mobileToc) {
    const toggle = mobileToc.querySelector("[data-mobile-toc-toggle]");
    const panel = mobileToc.querySelector("[data-mobile-toc-panel]");
    const current = mobileToc.querySelector("[data-mobile-toc-current]");
    const tocTitle = mobileToc.getAttribute("data-toc-title") || "Seitenübersicht";
    const links = [...mobileToc.querySelectorAll("[data-mobile-toc-link]")];
    const headings = [...document.querySelectorAll(".schule-content [data-section-heading]")];

    const setOpen = (open) => {
      mobileToc.setAttribute("data-open", open ? "true" : "false");
      toggle?.setAttribute("aria-expanded", open ? "true" : "false");
      if (panel) {
        panel.classList.toggle("hidden", !open);
      }
    };

    setOpen(false);

    toggle?.addEventListener("click", () => {
      const isOpen = mobileToc.getAttribute("data-open") === "true";
      setOpen(!isOpen);
    });

    links.forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    const headingIndex = new Map();
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) {
        return;
      }
      const id = href.slice(1);
      if (id && !headingIndex.has(id)) {
        headingIndex.set(id, link.textContent?.trim() || "");
      }
    });

    const updateCurrent = () => {
      if (!headings.length || !current) {
        return;
      }
      const marker = window.scrollY + 140;
      let active = headings[0];
      headings.forEach((h) => {
        if (h.offsetTop <= marker) {
          active = h;
        }
      });
      const id = active.getAttribute("id") || "";
      const label = headingIndex.get(id) || active.textContent?.trim() || tocTitle;
      current.textContent = `${tocTitle} > ${label}`;
    };

    window.addEventListener("scroll", updateCurrent, { passive: true });
    updateCurrent();
  }
})();
