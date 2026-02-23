export const ClearButton = () => {
  return (
    <button
      className="btn btn-circle btn-ghost btn-sm absolute right-0 top-0 mr-2 mt-3"
      type="button"
    >
      <svg
        className="h-4 w-4 fill-current stroke-current"
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
    </button>
  );
};
