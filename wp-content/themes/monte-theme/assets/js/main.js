/**
 * Monte Theme JavaScript
 * Mmenu.js and Swiper implementation
 */

import Mmenu from "mmenu-js";
import "mmenu-js/dist/mmenu.css";
import Swiper from "swiper/bundle";
import "swiper/css/bundle";

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // Initialize Mmenu.js for mobile navigation
    // ----------------------------------------
    const menuElement = document.querySelector("#mymenu");

    if (menuElement) {
      try {
        // Remove hidden class from menu
        menuElement.classList.remove("hidden");

        // Initialize Mmenu
        const menu = new Mmenu(
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

        const api = menu.API;

        // Mobile menu toggle button
        const toggleButton = document.querySelector("#mobile-menu-toggle");
        if (toggleButton) {
          toggleButton.addEventListener("click", (e) => {
            e.preventDefault();
            api.open();
          });
        }
      } catch (error) {
        console.error("Mmenu.js initialization failed:", error);
        // Fallback: ensure menu is still accessible
        menuElement.classList.remove("hidden");
      }
    }

    // Add envelope icons to mailto links
    // ----------------------------------------
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach((link) => {
      if (!link.querySelector(".fa-envelope")) {
        link.innerHTML = '<i class="fa fa-envelope"></i>&nbsp;' + link.innerHTML;
      }
    });

    // Initialize Swiper slider
    // ----------------------------------------
    const testimonialSlider = document.querySelector(".testimonial-slider");

    if (testimonialSlider) {
      try {
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
      } catch (error) {
        console.error("Swiper (testimonial slider) initialization failed:", error);
      }
    }

    // Homepage slider (if exists)
    // ----------------------------------------
    const homepageSlider = document.querySelector(".homepage-slider");

    if (homepageSlider) {
      try {
        new Swiper(".homepage-slider", {
          spaceBetween: 24,
          loop: true,
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
          },
          pagination: {
            el: ".homepage-slider-pagination",
            type: "bullets",
            clickable: true,
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
      } catch (error) {
        console.error("Swiper (homepage slider) initialization failed:", error);
      }
    }
  });
})();
