import { FaGithub } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="p-2 text-sm text-gray-400 dark:text-slate-400">
      <a
        href="https://github.com/JEK58/wprs-forecast"
        className="flex items-center justify-center text-xs"
      >
        <FaGithub className="mr-1" />
        Made with ❤️ by Stephan Schöpe
      </a>
    </footer>
  );
}
