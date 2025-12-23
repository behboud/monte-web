/**
 * Monte Theme Editor Scripts
 * Ensure custom fonts are properly loaded and applied in the block editor
 */

(function () {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeFonts);
  } else {
    initializeFonts();
  }

  function initializeFonts() {
    // Create a style element for the fonts if it doesn't exist
    const styleId = "monte-editor-fonts-inline";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @font-face {
          font-family: "Zapfino";
          src: url("${monteThemeData.themeUrl}/assets/fonts/ZapfinoExtraLT-One.woff2") format("woff2"),
               url("${monteThemeData.themeUrl}/assets/fonts/Zapfino.woff") format("woff");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        /* Ensure all blocks can use the fonts */
        .wp-block,
        .editor-styles-wrapper,
        .block-editor-writing-flow {
          font-family: inherit;
        }

        /* Zapfino font application */
        .has-zapfino-font-family,
        .wp-block[style*="font-family: Zapfino"],
        [data-font="zapfino"] {
          font-family: "Zapfino", cursive !important;
        }

        /* Tangerine font application */
        .has-tangerine-font-family,
        [data-font="tangerine"] {
          font-family: "Tangerine", cursive !important;
        }

        /* Overpass font application */
        .has-overpass-font-family,
        [data-font="overpass"] {
          font-family: "Overpass", sans-serif !important;
        }

        /* Ensure headings and paragraphs render with font changes */
        .wp-block-heading,
        .wp-block-paragraph,
        .editor-rich-text__editable {
          font-family: inherit;
        }

        /* Ensure the editor iframe also has access to fonts */
        .block-editor-iframe {
          font-family: inherit;
        }
      `;
      document.head.appendChild(style);
    }

    // Observe changes to apply fonts to dynamically added blocks
    observeEditorChanges();
  }

  function observeEditorChanges() {
    // Use MutationObserver to watch for new blocks
    const editorContainer = document.querySelector(".editor-styles-wrapper") || document.querySelector(".wp-block-post-content");

    if (editorContainer) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === "childList") {
            // Apply font styling to newly added blocks
            applyFontStyles();
          }
        });
      });

      observer.observe(editorContainer, {
        childList: true,
        subtree: true,
      });
    }

    // Also check the iframe
    setTimeout(function () {
      const iframe = document.querySelector("iframe.block-editor-iframe");
      if (iframe && iframe.contentDocument) {
        injectFontsToIframe(iframe);
      }
    }, 1000);
  }

  function injectFontsToIframe(iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc.getElementById("monte-iframe-fonts")) {
        const style = iframeDoc.createElement("style");
        style.id = "monte-iframe-fonts";
        style.textContent = `
          @font-face {
            font-family: "Zapfino";
            src: url("${monteThemeData.themeUrl}/assets/fonts/ZapfinoExtraLT-One.woff2") format("woff2"),
                 url("${monteThemeData.themeUrl}/assets/fonts/Zapfino.woff") format("woff");
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: "Tangerine";
            src: url("https://fonts.gstatic.com/s/tangerine/v24/KLawOZcQWoAkR6zhvwWqPt2Bg-5Kcyzlwkxjxxnn9Dl7sOhiH-WNsA.woff2") format("woff2");
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: "Overpass";
            src: url("https://fonts.gstatic.com/s/overpass/v14/qFdB35aDMxSJYbQM-geAJS4J.woff2") format("woff2");
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }

          body {
            font-family: "Overpass", sans-serif;
          }

          .has-zapfino-font-family {
            font-family: "Zapfino", cursive !important;
          }

          .has-tangerine-font-family {
            font-family: "Tangerine", cursive !important;
          }

          .has-overpass-font-family {
            font-family: "Overpass", sans-serif !important;
          }

          p, h1, h2, h3, h4, h5, h6 {
            font-family: inherit;
          }
        `;
        iframeDoc.head.appendChild(style);
      }
    } catch (e) {
      console.log("Cannot access iframe for font injection:", e);
    }
  }

  function applyFontStyles() {
    document.querySelectorAll('[style*="font-family"]').forEach(function (el) {
      // Ensure font is applied
      if (el.style.fontFamily) {
        el.style.fontFamily = el.style.fontFamily;
      }
    });
  }

  // Expose function to window for debugging
  window.monteApplyFonts = applyFontStyles;
})();
