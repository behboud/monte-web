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
      pagination: {
        el: ".hero-slider-pagination",
        clickable: true,
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
      pagination: {
        el: ".hero-slider-pagination",
        clickable: true,
      },
    });
  }

  const mobileToc = document.querySelector("[data-mobile-toc]");
  if (mobileToc) {
    const toggle = mobileToc.querySelector("[data-mobile-toc-toggle]");
    const panel = mobileToc.querySelector("[data-mobile-toc-panel]");
    const current = mobileToc.querySelector("[data-mobile-toc-current]");
    const tocTitle = mobileToc.getAttribute("data-toc-title") || "Seitenübersicht";
    const links = [...mobileToc.querySelectorAll("[data-mobile-toc-link]")];
    const headings = [...document.querySelectorAll(".schule-content h2[id], .schule-content h3[id]")];

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
