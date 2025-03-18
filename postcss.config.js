
module.exports = {
    plugins: [
        require('postcss-import'),
        require('tailwindcss'),
        require('franken-ui/postcss/combine-duplicated-selectors')({
            removeDuplicatedProperties: true
        }),
        require('autoprefixer')
    ]
}