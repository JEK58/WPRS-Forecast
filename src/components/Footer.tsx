import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="mb-3 p-2 text-xs  text-gray-400 dark:text-slate-400">
      <div className="mb-2 flex items-center justify-center gap-2">
        <a
          href="https://www.stephanschoepe.de/impressum"
          target="_blank"
          rel="noopener noreferrer"
        >
          Impressum
        </a>
        <span>|</span>
        <Link href="/stats">Recent queries</Link>
      </div>
      <a
        href="https://github.com/JEK58/wprs-forecast"
        className="flex items-center"
      >
        <FaGithub className="mr-1" />
        Made with ❤️ by Stephan Schöpe
      </a>
    </footer>
  );
}
