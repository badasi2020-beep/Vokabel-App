/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Fraunces'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"]
      },
      colors: {
        cream: {
          DEFAULT: "#F6F1E7",
          soft: "#FBF8F2",
          deep: "#EDE5D3"
        },
        forest: {
          DEFAULT: "#2F3E33",
          light: "#4A5D4E",
          soft: "#6B7D6E"
        },
        clay: {
          DEFAULT: "#B5673A",
          soft: "#D99A6C"
        }
      },
      borderRadius: {
        card: "22px",
        pill: "999px"
      },
      boxShadow: {
        card: "0 4px 18px rgba(47, 62, 51, 0.08)"
      }
    }
  },
  plugins: []
};
