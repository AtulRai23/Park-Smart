/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Tell Tailwind which files it should scan
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  // 2. Custom theme tweaks
  theme: {
    extend: {
      colors: {
        brand:  "#2563eb",   // primary accent
        darkbg: "#0e0117",   // dark background
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,.45)",
      },
    },
  },

  // 3. Extra plugins (none for now)
  plugins: [],
};
