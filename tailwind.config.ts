import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#22c55e",
      },
    },
  },
  plugins: [require("daisyui"), require("tailwindcss-animate")],
} satisfies Config;
