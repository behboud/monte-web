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

  const initializeSlider = (sliderElement) => {
    if (!sliderElement || typeof Swiper === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    new Swiper(sliderElement, {
      effect: "fade",
      loop: !reduceMotion,
      speed: reduceMotion ? 0 : 800,
      autoplay: reduceMotion
        ? false
        : {
            delay: 5000,
            disableOnInteraction: false,
          },
    });
  };

  initializeSlider(document.querySelector(".hero-slider"));
  initializeSlider(document.querySelector(".schule-slider"));

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
      const label = headingIndex.get(id) || active.getAttribute("data-section-label") || active.textContent?.trim() || tocTitle;
      current.textContent = `${tocTitle} > ${label}`;
    };

    window.addEventListener("scroll", updateCurrent, { passive: true });
    updateCurrent();
  }

  const pageOutline = document.querySelector("[data-page-outline]");
  const pageOutlineList = pageOutline?.querySelector("[data-page-outline-list]");
  const pageOutlineTitle = pageOutline?.querySelector("[data-page-outline-title]");
  const pageOutlineProgress = pageOutline?.querySelector("[data-page-outline-progress]");

  if (pageOutline && pageOutlineList && pageOutlineProgress) {
    const contentRoots = [...document.querySelectorAll("[data-page-outline-content]")];
    const introSlider = document.querySelector(".schule-slider, .hero-slider");
    const introBoundary = introSlider?.closest("section") || introSlider?.parentElement || introSlider;
    const headingEntries = contentRoots.flatMap((root) => [...root.querySelectorAll("h2, h3")].filter((heading) => heading.textContent?.trim() && !heading.closest("[hidden]")).map((heading) => ({ heading, root })));

    const makeUniqueID = (heading) => {
      if (heading.id) {
        return heading.id;
      }

      const baseID =
        (heading.textContent || "")
          .trim()
          .toLocaleLowerCase("de-DE")
          .replace(/ß/g, "ss")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "abschnitt";
      let id = baseID;
      let suffix = 2;

      while (document.getElementById(id) && document.getElementById(id) !== heading) {
        id = `${baseID}-${suffix}`;
        suffix += 1;
      }

      heading.id = id;
      return id;
    };

    if (headingEntries.length >= 3) {
      const pageTitle = document.querySelector("main h1");
      if (pageTitle && pageOutlineTitle) {
        const titleID = makeUniqueID(pageTitle);
        pageOutlineTitle.href = `#${encodeURIComponent(titleID)}`;
        pageOutlineTitle.textContent = pageTitle.textContent?.trim() || "";
      } else if (pageOutlineTitle) {
        pageOutlineTitle.hidden = true;
      }

      const linkByHeading = new Map();
      const createLink = (heading, level) => {
        const item = document.createElement("li");
        item.className = `page-outline-item page-outline-item--level-${level}`;
        const link = document.createElement("a");
        link.className = `page-outline-link page-outline-link--level-${level}`;
        link.href = `#${encodeURIComponent(makeUniqueID(heading))}`;
        link.textContent = heading.textContent.trim().replace(/\s+/g, " ");
        link.setAttribute("data-page-outline-link", "");
        item.append(link);
        linkByHeading.set(heading, link);
        return item;
      };

      let currentRoot = null;
      let currentGroup = null;

      headingEntries.forEach(({ heading, root }) => {
        if (root !== currentRoot) {
          currentRoot = root;
          currentGroup = null;
        }

        if (heading.tagName === "H2" || !currentGroup) {
          currentGroup = createLink(heading, heading.tagName === "H2" ? 2 : 3);
          pageOutlineList.append(currentGroup);
          return;
        }

        let sublist = currentGroup.querySelector(":scope > ol");
        if (!sublist) {
          sublist = document.createElement("ol");
          sublist.className = "page-outline-sublist";
          currentGroup.append(sublist);
        }
        sublist.append(createLink(heading, 3));
      });

      const setCurrent = (activeHeading) => {
        linkByHeading.forEach((link, heading) => {
          if (heading === activeHeading) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });

        if (pageOutlineTitle) {
          if (!activeHeading) {
            pageOutlineTitle.setAttribute("aria-current", "location");
          } else {
            pageOutlineTitle.removeAttribute("aria-current");
          }
        }
      };

      linkByHeading.forEach((link, heading) => {
        link.addEventListener("click", () => setCurrent(heading));
      });

      const updatePageOutline = () => {
        const stickyNavigation = document.querySelector("[data-sticky-navigation]");
        const stickyHeight = stickyNavigation?.getBoundingClientRect().height || 0;
        const marker = stickyHeight + Math.max(96, Math.round(window.innerHeight * 0.15));
        let activeHeading = null;
        let firstVisibleHeading = null;

        for (const { heading } of headingEntries) {
          const headingRect = heading.getBoundingClientRect();
          if (headingRect.top <= marker) {
            activeHeading = heading;
          } else {
            if (headingRect.top < window.innerHeight && headingRect.bottom > stickyHeight) {
              firstVisibleHeading = heading;
            }
            break;
          }
        }
        activeHeading ||= firstVisibleHeading;

        const atDocumentEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        if (atDocumentEnd) {
          activeHeading = headingEntries.at(-1)?.heading || activeHeading;
        }
        setCurrent(activeHeading);

        const firstRoot = contentRoots[0];
        const lastRoot = contentRoots.at(-1);
        if (!firstRoot || !lastRoot) {
          return;
        }

        const firstRootRect = firstRoot.getBoundingClientRect();
        const lastRootRect = lastRoot.getBoundingClientRect();
        const hasPassedIntro = introBoundary ? introBoundary.getBoundingClientRect().bottom <= stickyHeight : firstRootRect.top < window.innerHeight;
        const contentIsVisible = lastRootRect.bottom > stickyHeight;
        pageOutline.hidden = !(hasPassedIntro && contentIsVisible);

        if (pageOutline.hidden) {
          pageOutline.style.setProperty("--page-outline-progress", "0");
          return;
        }

        const currentLink = pageOutline.querySelector('[data-page-outline-title][aria-current="location"], [data-page-outline-link][aria-current="location"]');
        const currentLinkRect = currentLink?.getBoundingClientRect();
        const outlineRect = pageOutline.getBoundingClientRect();
        const outlineHeight = pageOutline.clientHeight;
        const currentMarker = currentLinkRect ? currentLinkRect.top + currentLinkRect.height / 2 : outlineRect.top;
        const progress = outlineHeight > 0 ? Math.min(1, Math.max(0, (currentMarker - outlineRect.top) / outlineHeight)) : 0;
        pageOutline.style.setProperty("--page-outline-progress", String(progress));
      };

      let updateFrame = 0;
      const schedulePageOutlineUpdate = () => {
        if (updateFrame) {
          return;
        }
        updateFrame = window.requestAnimationFrame(() => {
          updateFrame = 0;
          updatePageOutline();
        });
      };

      window.addEventListener("scroll", schedulePageOutlineUpdate, { passive: true });
      window.addEventListener("resize", schedulePageOutlineUpdate);
      updatePageOutline();
      document.fonts?.ready.then(schedulePageOutlineUpdate);
    }
  }

  if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches && "IntersectionObserver" in window) {
    const revealGroups = [];
    const headingSelector = "h2, h3, h4";
    const blockSelector = `${headingSelector}, p, blockquote, figure, ul, ol, table, pre, .reading-prose`;

    document.querySelectorAll("[data-page-outline-content]").forEach((root) => {
      const source = root.children.length === 1 && root.firstElementChild?.matches(".reading-prose") ? root.firstElementChild : root;
      const blocks = [...source.children];
      let group = [];
      let pending = [];

      const flushGroup = () => {
        if (group.length) {
          revealGroups.push(group);
          group = [];
        }
      };

      blocks.forEach((block) => {
        if (block.matches(".section-banner")) {
          flushGroup();
          pending.push(block);
          return;
        }

        if (block.matches(headingSelector)) {
          flushGroup();
          group = pending;
          pending = [];
          group.push(block);
          return;
        }

        if (!block.matches(blockSelector)) {
          return;
        }
        if (group.length) {
          group.push(block);
        } else {
          pending.push(block);
        }
      });

      flushGroup();
      if (pending.length) {
        revealGroups.push(pending);
      }
    });

    document.querySelectorAll(".donation-project").forEach((project) => {
      const projectParts = [project.querySelector(".donation-project-media"), project.querySelector(".donation-project-copy h3"), project.querySelector(".donation-project-content")].filter(Boolean);
      if (projectParts.length) revealGroups.push(projectParts);
    });

    document.querySelectorAll(".past-donation-card").forEach((card) => {
      const donationParts = [card.querySelector(".past-donation-copy h3"), card.querySelector(".past-donation-content"), card.querySelector(".past-donation-media")].filter(Boolean);
      if (donationParts.length) revealGroups.push(donationParts);
    });

    const revealTargets = [...new Set(revealGroups.flat())];
    if (revealTargets.length) {
      revealGroups.forEach((group) => {
        group.forEach((element, index) => {
          element.dataset.reveal = "";
          element.style.setProperty("--reveal-delay", `${Math.min(index, 2) * 80}ms`);
        });
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
      );

      revealTargets.forEach((element) => observer.observe(element));
      htmlElement.classList.add("js");
    }
  }
})();
