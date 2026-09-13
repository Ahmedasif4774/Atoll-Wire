import Header from "@/components/en/Header";
import Nav from "@/components/en/Nav";
import Footer from "@/components/en/Footer";
import InfoPage from "@/components/en/InfoPage";

export default function EnTermsPage() {
  return (
    <>
      <Header dvHref="/terms" />
      <Nav />
      <InfoPage
        title="Terms of Use"
        updated="Last updated: 7 September 2026"
        intro='These Terms of Use govern your access to and use of AtollWire, including our website, articles, and any related services (together, the "Service"). By using the Service, you agree to these terms.'
        sections={[
          {
            heading: "Using our content",
            paragraphs: [
              'Articles, photos, graphics, and other content published on AtollWire are the property of AtollWire or its licensors. You may share links to our articles freely. Reproducing, republishing, or redistributing our content in full without permission is not allowed, except for short quotations with clear attribution and a link back to the original article.',
            ],
          },
          {
            heading: "Comments and submissions",
            paragraphs: [
              "If we offer comment sections, tip lines, or other ways for readers to submit content, you agree not to post anything unlawful, defamatory, harassing, or otherwise inappropriate. We reserve the right to remove any submitted content at our discretion.",
            ],
          },
          {
            heading: "Accuracy of information",
            paragraphs: [
              "We work to keep our reporting accurate and up to date, but news can change quickly. AtollWire makes no guarantee that any article is complete, error-free, or current at the time you read it. See our Editorial Policy for how we handle corrections.",
            ],
          },
          {
            heading: "Limitation of liability",
            paragraphs: [
              'AtollWire is provided "as is." We are not liable for any loss or damage arising from your use of the Service, including reliance on any information published here, to the fullest extent permitted by law.',
            ],
          },
          {
            heading: "Changes to these terms",
            paragraphs: [
              "We may update these Terms of Use from time to time. Continued use of the Service after changes are posted means you accept the updated terms.",
            ],
          },
          {
            heading: "Contact",
            paragraphs: [
              "Questions about these terms can be sent to our editorial team through the contact details listed on our homepage.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
