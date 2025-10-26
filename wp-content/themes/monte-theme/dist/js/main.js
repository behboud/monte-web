// Monte Theme Main JavaScript
(function () {
  "use strict";

  // Add mailto icon styling
  document.addEventListener("DOMContentLoaded", () => {
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach((link) => {
      if (!link.querySelector('.fa-envelope')) {
        link.innerHTML = '<i class="fa fa-envelope"></i>&nbsp;' + link.innerHTML;
      }
    });

    // Initialize Mmenu if available and menu exists
    const mobileMenu = document.querySelector("#mymenu");
    if (mobileMenu && typeof Mmenu !== 'undefined') {
      // Remove hidden class
      mobileMenu.classList.remove("hidden");
      
      // Initialize Mmenu
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
              selector: "body",
            },
          },
        }
      );
    }
  });

  // Franken UI theme initialization
  const htmlElement = document.documentElement;
  const __FRANKEN__ = JSON.parse(localStorage.getItem("__FRANKEN__") || "{}");

  htmlElement.classList.remove("dark");
  htmlElement.classList.add(__FRANKEN__.theme || "uk-theme-zinc");
  htmlElement.classList.add(__FRANKEN__.radii || "uk-radii-md");
  htmlElement.classList.add(__FRANKEN__.shadows || "uk-shadows-sm");
  htmlElement.classList.add(__FRANKEN__.font || "uk-font-sm");
  htmlElement.classList.add(__FRANKEN__.chart || "uk-chart-default");

  // Image Slider (if Swiper is available)
  if (typeof Swiper !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
      const sliders = document.querySelectorAll(".image-slider, .testimonial-slider");
      sliders.forEach((slider) => {
        new Swiper(slider, {
          spaceBetween: 24,
          loop: true,
          pagination: {
            el: slider.querySelector('.swiper-pagination'),
            type: "bullets",
            clickable: true,
          },
          navigation: {
            nextEl: slider.querySelector('.swiper-button-next'),
            prevEl: slider.querySelector('.swiper-button-prev'),
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
      });
    });
  }
})();
