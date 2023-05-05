import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="mb-3 flex gap-2 p-2 text-sm text-gray-400 dark:text-slate-400">
      <a
        href="https://github.com/JEK58/wprs-forecast"
        className="flex items-center justify-center text-xs"
      >
        <FaGithub className="mr-1" />
        Made with ❤️ by Stephan Schöpe
      </a>
      |
      <a
        href="https://www.stephanschoepe.de/impressum"
        className="flex items-center justify-center text-xs"
      >
        Impressum
      </a>
      |
      <Link className="flex items-center justify-center text-xs" href="/stats">
        Statistics
      </Link>
    </footer>
  );
}
