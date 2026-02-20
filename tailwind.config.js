/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#DB2777', // Cherry Blossom Pink (Deep)
                secondary: '#F5F5DC', // Beige
                dark: '#1a1a1a', // Black-ish
                light: '#ffffff', // White
                gray: {
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    800: '#1f2937',
                    900: '#111827',
                }
            },
            fontFamily: {
                sans: ['"Be Vietnam Pro"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
