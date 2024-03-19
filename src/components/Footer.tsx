import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto w-full bg-gray-800 p-4 text-center text-sm text-gray-300 ">
      <div className="mx-auto max-w-7xl space-x-4 px-4 sm:px-6 lg:px-8">
        <Link
          className="hover:underline"
          href="https://www.stephanschoepe.de/impressum"
        >
          Impressum
        </Link>
        <span className="text-gray-400">|</span>

        <Link
          className="hover:underline"
          href="https://github.com/JEK58/wprs-forecast"
        >
          Made with
          <svg
            className="mx-1 inline text-red-500 "
            fill="none"
            height="20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          by Stephan Schöpe
        </Link>
      </div>
    </footer>
  );
}
