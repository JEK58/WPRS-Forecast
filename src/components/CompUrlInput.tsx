import Link from "next/link";
import Box from "@/components/ui/Box";
import { CompUrlInputField } from "./CompUrlInputField";

export function CompUrlInput() {
  return (
    <Box>
      <h2 className="text-lg font-bold dark:text-slate-200">Link to Comp</h2>

      <CompUrlInputField />

      {/* Notes */}
      <div className="border-t border-gray-200 py-2 text-gray-400 dark:border-slate-600">
        <ul className="list-outside list-disc px-4 text-gray-500 dark:text-inherit">
          <li>This only works for paragliding competitions.</li>
          <li>
            Make sure to paste the correct link from the platform that actually
            hosts the comp - even if civlcomps.org lists them all.
          </li>
          <li>
            The calculation will become{" "}
            <span className="font-semibold">more accurate</span> as the
            competition date approaches.
          </li>
          <li>
            PWC events may currently not give correct results or not work at
            all. I have to adapt to the new events page.
          </li>
          <li> It will not work for past events. It&apos;s a forecast!</li>
        </ul>
        <p className="mt-2 text-gray-500 dark:text-inherit">
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
