import { FaGithub } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="mb-3 p-2 text-xs  text-gray-400 dark:text-slate-400">
      <div className="mb-2 flex items-center justify-center gap-2">
        <a
          href="https://github.com/JEK58/wprs-forecast"
          className="flex items-center"
        >
          <FaGithub className="mr-1" />
          Made with ❤️ by Stephan Schöpe
        </a>
        <span>|</span>
        <a href="https://www.stephanschoepe.de/impressum">Impressum</a>
      </div>
    </footer>
  );
}
