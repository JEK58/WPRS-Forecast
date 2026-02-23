import Link from "next/link";

export function ForecastSkeleton() {
  return (
    <>
      <div className="animate-pulse overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="grow">
            <div className="mb-4 h-6 w-56 rounded-md bg-gray-500"></div>
            <div className="mb-4 flex h-5 w-32 rounded-md bg-gray-400"></div>
          </div>
          <Link
            href="/"
            aria-label="Back"
            className="btn btn-circle btn-ghost btn-sm animate-none"
          >
            <svg
              className="h-5 w-5 fill-current stroke-current"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.4 6.4l7.2 7.2m0-7.2l-7.2 7.2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className="mb-4 flex h-5 w-24 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-96 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-48 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-40 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-52 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-48 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-36 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-44 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-40 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 w-32 rounded-md bg-gray-400"></div>
        <div className="mb-2 flex h-5 rounded-md bg-gray-400"></div>
        <div className="mb-5 flex h-5 w-72 rounded-md bg-gray-400"></div>
        <div className="mb-3 flex h-14 rounded-md bg-gray-300"></div>
        <progress className="progress progress-success"></progress>
        <div className="">Getting pilots details and ranking...</div>
      </div>
    </>
  );
}
