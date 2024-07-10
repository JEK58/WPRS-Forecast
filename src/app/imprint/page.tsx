import Box from "@/components/ui/Box";

export default async function Page() {
  return (
    <div className="mx-auto flex w-full flex-col p-3 md:max-w-3xl">
      <Box>
        <h2 className="mb-6 text-2xl font-bold">Imprint</h2>
        <p className="mb-6">This website is operated by:</p>

        <div className="mb-6">
          <p className="font-semibold">Stephan Schöpe</p>
          <p>Geibelstr. 3</p>
          <p>50931 Köln</p>
          <p>Germany</p>
          <p>
            <a
              href="mailto:hitme@stephanschoepe.de"
              className="text-blue-500 underline"
            >
              hitme@stephanschoepe.de
            </a>
          </p>
        </div>

        <div>
          <p className="font-semibold">Disclaimer:</p>
          <p className="mb-6">
            Despite careful content control, we assume no liability for the
            content of external links. The operators of the linked pages are
            solely responsible for their content.
          </p>
        </div>

        <h2 className="mb-6 mt-8 text-2xl font-bold">Privacy Policy</h2>

        <p className="mb-6">
          Effective Date: <span className="font-semibold">2024-JUL-10</span>
        </p>

        <p className="mb-6">
          This Privacy Policy outlines the types of information we collect, how
          we use it, and how we safeguard your information.
        </p>

        <h3 className="text-1xl mb-4 font-semibold">Information We Collect</h3>
        <ol className="mb-6 list-inside list-decimal">
          <li className="mb-4">
            <span className="font-semibold">Analytics Data:</span> We use
            Plausible Analytics, a privacy-focused web analytics service, to
            collect anonymized data about visitor interactions on our website.
            This includes information such as pages visited, time spent on each
            page, and general interactions with the website. Plausible Analytics
            does not use cookies and does not collect any personally
            identifiable information (PII).
          </li>
          <li>
            <span className="font-semibold">Error Monitoring:</span> We use
            Sentry, a hosted error monitoring service, to collect information
            about errors and issues that occur while you browse our website.
            This may include technical data such as error messages and stack
            traces. Sentry helps us identify and fix technical problems to
            improve the performance and usability of our website.
          </li>
        </ol>

        <h3 className="text-1xl mb-4 font-semibold">
          How We Use Your Information
        </h3>
        <ul className="mb-6 list-inside list-disc">
          <li className="mb-4">
            <span className="font-semibold">Analytics:</span> The data collected
            by Plausible Analytics helps us understand how visitors use our
            website. This information is used solely for the purpose of
            improving our websites content and user experience.
          </li>
          <li>
            <span className="font-semibold">Error Monitoring:</span> Information
            collected by Sentry is used to diagnose and resolve technical issues
            that may affect the functionality of our website. This helps us
            ensure that our website operates smoothly for all users.
          </li>
        </ul>

        <h3 className="text-1xl mb-4 font-semibold">Data Security</h3>
        <p className="mb-6">
          We take appropriate measures to protect the information collected
          through Plausible Analytics and Sentry from unauthorized access,
          disclosure, alteration, or destruction. Access to this data is
          restricted to authorized personnel only, and we utilize
          industry-standard security protocols to safeguard this information.
        </p>

        <h3 className="text-1xl mb-4 font-semibold">Third-Party Services</h3>
        <ul className="mb-6 list-inside list-disc">
          <li className="mb-4">
            <span className="font-semibold">Plausible Analytics:</span> For more
            information on how Plausible Analytics collects and processes data,
            please visit their{" "}
            <a
              href="https://plausible.io/privacy"
              className="text-blue-500 underline"
            >
              Privacy Policy
            </a>
            .
          </li>
          <li>
            <span className="font-semibold">Sentry:</span> For more information
            on how Sentry collects and processes data, please visit their{" "}
            <a
              href="https://sentry.io/privacy/"
              className="text-blue-500 underline"
            >
              Privacy Policy
            </a>
            .
          </li>
        </ul>

        <h3 className="text-1xl mb-4 font-semibold">
          Changes to This Privacy Policy
        </h3>
        <p className="mb-6">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or for other operational, legal, or regulatory
          reasons. We encourage you to review this Privacy Policy periodically
          for any changes. The date of the last update will be indicated at the
          top of this page.
        </p>

        <h3 className="text-1xl mb-4 font-semibold">Contact Us</h3>
        <p>
          If you have any questions about this Privacy Policy or our data
          practices, please contact us at{" "}
          <a
            href="mailto:hitme@stephanschoepe.de"
            className="text-blue-500 underline"
          >
            hitme@stephanschoepe.de
          </a>
          .
        </p>

        <p className="mt-6">
          By using our website, you consent to the collection and use of
          information as described in this Privacy Policy.
        </p>
      </Box>
    </div>
  );
}
