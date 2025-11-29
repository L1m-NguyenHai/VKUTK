/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Plugin gradient colors - these are dynamically applied from API
    "from-purple-500",
    "to-indigo-500",
    "from-blue-500",
    "to-cyan-500",
    "from-pink-500",
    "to-rose-500",
    "from-yellow-500",
    "to-amber-500",
    "from-orange-500",
    "to-yellow-500",
    "from-indigo-500",
    "to-purple-500",
    "from-green-500",
    "to-teal-500",
    "from-gray-500",
    "to-gray-600",
    "from-red-500",
    "to-pink-500",
    "from-teal-500",
    "to-green-500",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
