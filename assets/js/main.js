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
  document.addEventListener('DOMContentLoaded', function() {
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach(link => {
      link.innerHTML = '<i class="fa fa-envelope"></i>&nbsp;' + link.innerHTML;
    });
  });

  // Mmenu plugin
  // ----------------------------------------
  document.addEventListener(
    "DOMContentLoaded", () => {
      new Mmenu("#mymenu", {
        navbar: {
          title: "Montessorischule Gilching"
        },
        offCanvas: {
          position: "left-front"
        }
      }, {
        classNames: {
          selected: "active"
      },
        offCanvas: {
          page: {
            selector: "#page"
          }
        }
      });
    }
  );

  const htmlElement = document.documentElement;

  const __FRANKEN__ = JSON.parse(
    localStorage.getItem("__FRANKEN__") || "{}"
  );

  if (
    __FRANKEN__.mode === "dark" ||
    (!__FRANKEN__.mode &&
      window.matchMedia("(prefers-color-scheme: light)").matches)
  ) {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }

  htmlElement.classList.add(__FRANKEN__.theme || "uk-theme-zinc");
  htmlElement.classList.add(__FRANKEN__.radii || "uk-radii-md");
  htmlElement.classList.add(__FRANKEN__.shadows || "uk-shadows-sm");
  htmlElement.classList.add(__FRANKEN__.font || "uk-font-sm");
  htmlElement.classList.add(__FRANKEN__.chart || "uk-chart-default");

  // Testimonial Slider
  // ----------------------------------------
  new Swiper(".testimonial-slider", {
    spaceBetween: 24,
    loop: true,
    pagination: {
      el: ".testimonial-slider-pagination",
      type: "bullets",
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
    },
  });
})();
