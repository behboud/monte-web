/** @type {import('tailwindcss').Config} */
export default {
  content: ["hugo_stats.json", "content/**/*.md", "layouts/**/*.html"],
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
        calligraphy: ["Playfair Display", "Playfair Display Fallback", "serif"],
        sans: ["Overpass", "Overpass Fallback", "sans-serif"],
      },
    },
  },
  safelist: ["ProseMirror", "ProseMirror-focused", "tiptap", "mr-2", "mt-2", "opacity-50"],
  plugins: [],
};
