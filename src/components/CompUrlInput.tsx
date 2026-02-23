import Link from "next/link";
import Box from "@/components/ui/Box";
import { CompUrlInputField } from "./CompUrlInputField";

export function CompUrlInput() {
  return (
    <Box>
      <h2 className="card-title">Link to Comp</h2>

      <CompUrlInputField />

      <div className="mt-4 border-t border-gray-200 py-2">
        <ul className="list-outside list-disc px-4 text-gray-500">
          <li>This only works for XC paragliding competitions.</li>
          <li>
            Make sure to paste the correct link from the platform that actually
            hosts the comp - even if civlcomps.org lists them all.
          </li>
          <li>
            The calculation will become{" "}
            <span className="font-semibold">more accurate</span> as the
            competition date approaches.
          </li>

          <li> It will not work for past events. It&apos;s a forecast!</li>
        </ul>
        <p className="mt-2 text-gray-500">
          See the{" "}
          <Link
            className="text-green-500 underline decoration-green-500 decoration-dotted hover:decoration-solid"
            href="/history"
          >
            history page
          </Link>{" "}
          for forecast accuracy statistics.
        </p>
      </div>
    </Box>
  );
}
