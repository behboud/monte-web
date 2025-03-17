
module.exports = {
    plugins: {
        'postcss-import': {},
        tailwindcss: {
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
            plugins: [],
        },
        autoprefixer: {},
    }
}