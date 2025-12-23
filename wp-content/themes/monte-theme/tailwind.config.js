import franken from "franken-ui/shadcn-ui/preset-quick";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [franken],
  content: ["./**/*.php", "./assets/js/**/*.js", "./assets/css/**/*.css"],
  theme: {
    extend: {
      colors: {
        primary: "#121212",
        body: "#fff",
        light: "#fcfaf7",
        monte: "#222477",
        foreground: "#222477",
        bgLight: "#fcfaf7",
      },
      fontFamily: {
        calligraphy: ["Tangerine", "cursive"],
        sans: ["Overpass", "sans-serif"],
        zapfino: ["Zapfino", "cursive"],
      },
    },
  },
  safelist: ["uk-h1", "uk-h2", "uk-h3", "uk-h4", "uk-paragraph", "uk-codespan", "uk-btn", "uk-btn-text", "ProseMirror", "ProseMirror-focused", "tiptap", "mr-2", "mt-2", "opacity-50", "hidden", "sm:inline-block", "max-sm:hidden"],
  plugins: [typography],
};
