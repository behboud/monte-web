// main script
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
  const mmenuListener = document.addEventListener(
    "DOMContentLoaded", () => {
      new Mmenu("#mymenu", {
        navbar: {
          title: "Montessorischule Gilching"
        },
        offCanvas: {
          position: "left-front"
        }
      }, {
        offCanvas: {
          page: {
            selector: "#page"
          }
        }
      });
    }
  );

  mmenuListener();

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
