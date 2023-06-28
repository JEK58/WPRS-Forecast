import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(125,50%,56%)",
      },
    },
  },
  plugins: [require("daisyui")],
} satisfies Config;
