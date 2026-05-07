import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-white/15 bg-slate-950/18 px-0 py-4 text-center text-sm text-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center space-x-4 px-4 sm:px-6 lg:px-8">
        <Link
          className="rounded-md py-1 align-middle whitespace-nowrap hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          href="/imprint"
        >
          Imprint & Privacy
        </Link>
        <span className="hidden py-1 text-white/35 sm:inline">|</span>
        <Link
          className="rounded-md py-1 align-middle whitespace-nowrap hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          href="https://github.com/JEK58/wprs-forecast"
          target="_blank"
          rel="noopener noreferrer"
        >
          Made with
          <svg
            className="mx-1 inline text-red-300"
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
