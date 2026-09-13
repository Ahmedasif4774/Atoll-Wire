import Header from "@/components/en/Header";
import Nav from "@/components/en/Nav";
import Footer from "@/components/en/Footer";
import InfoPage from "@/components/en/InfoPage";

export default function EnEditorialPolicyPage() {
  return (
    <>
      <Header dvHref="/editorial-policy" />
      <Nav />
      <InfoPage
        title="Editorial Policy"
        updated="Last updated: 7 September 2026"
        intro="AtollWire is committed to fair, accurate, and independent reporting on the Maldives and the wider region. This Editorial Policy outlines the standards our newsroom follows."
        sections={[
          {
            heading: "Editorial independence",
            paragraphs: [
              'Editorial decisions at AtollWire are made independently of advertisers, sponsors, and any political or commercial interest. Advertising content is always clearly labelled as "Sponsored" and is kept visually and editorially separate from our journalism.',
            ],
          },
          {
            heading: "Sourcing and verification",
            paragraphs: [
              "We aim to verify information with multiple sources before publishing, and to clearly attribute claims to the officials, documents, or organisations they come from. Where a claim cannot be independently verified, we say so.",
            ],
          },
          {
            heading: "Corrections",
            paragraphs: [
              "When we get something wrong, we correct it. Factual errors are fixed as soon as they are identified, and significant corrections are noted at the bottom of the affected article along with the date of the correction.",
            ],
          },
          {
            heading: "Bylines and attribution",
            paragraphs: [
              "Articles are published under the name of the journalist responsible for the reporting. Wire reports or contributions from multiple staff members are credited accordingly.",
            ],
          },
          {
            heading: "Appeals and fundraising content",
            paragraphs: [
              "Community appeals published under our Appeals section are reviewed for supporting documentation, such as referral letters or cost estimates, before publication. AtollWire facilitates these appeals but does not manage or guarantee the funds raised.",
            ],
          },
          {
            heading: "Feedback",
            paragraphs: [
              "Readers who believe a story is inaccurate or unfair are encouraged to contact our editorial team through the details listed on our homepage.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
