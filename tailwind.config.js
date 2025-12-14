/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'calligraphy': ['Inter', 'sans-serif'],
        'calligraphy-body': ['Inter', 'sans-serif'],
        'calligraphy-elegant': ['Inter', 'sans-serif'],
        'brand': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
