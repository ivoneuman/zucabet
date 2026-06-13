/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brazil: {
          green: '#009c3b',
          yellow: '#ffdf00',
          blue: '#002776',
          white: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
