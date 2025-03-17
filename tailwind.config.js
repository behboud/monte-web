/*
This file is present to satisfy a requirement of the Tailwind CSS IntelliSense
extension for Visual Studio Code.

https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss

The rest of this file is intentionally empty.
*/

import franken from 'franken-ui/shadcn-ui/preset-quick';

/** @type {import('tailwindcss').Config} */
export default {
	
    presets: [franken],
    files: [
        "hugo_stats.json",
    ],
    content: ["content/**/*.md", "layouts/**/*.html"],
    theme: {
        extend: {
            colors: {
                primary: "#121212",
                body: "#fff",
                light: "#fcfaf7",
                monte: "#222477",
                bgLight: "#fcfaf7",
            },
            fontFamily: {
                calligraphy: ["italic", "Zapfino"],
                sans: ["Overpass"],
            },
        },
    },
    safelist: [
        {
            pattern: /^uk-/
        },
        'ProseMirror',
        'ProseMirror-focused',
        'tiptap',
        'mr-2',
        'mt-2',
        'opacity-50'
    ],
    plugins: [

    ],
};