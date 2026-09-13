import Header from "@/components/en/Header";
import Nav from "@/components/en/Nav";
import Footer from "@/components/en/Footer";
import InfoPage from "@/components/en/InfoPage";

export default function EnPrivacyPage() {
  return (
    <>
      <Header dvHref="/privacy" />
      <Nav />
      <InfoPage
        title="Privacy Policy"
        updated="Last updated: 7 September 2026"
        intro="This Privacy Policy explains what information AtollWire collects when you use our website, and how we use it."
        sections={[
          {
            heading: "Information we collect",
            list: [
              "Basic usage data, such as pages visited and time spent on the site, collected automatically through standard analytics.",
              "Information you provide directly, such as your name or email if you contact us, submit a news tip, or sign up for a newsletter.",
              "Technical data like browser type and approximate location, used to serve the site correctly and measure traffic.",
            ],
          },
          {
            heading: "How we use this information",
            paragraphs: [
              "We use the information we collect to operate and improve AtollWire, understand which stories readers find useful, respond to messages you send us, and, where applicable, deliver relevant advertising.",
            ],
          },
          {
            heading: "Cookies",
            paragraphs: [
              "We use cookies and similar technologies to remember your preferences (such as dark mode) and to understand how the site is used. You can control cookies through your browser settings, though some features may not work correctly if cookies are disabled.",
            ],
          },
          {
            heading: "Advertising",
            paragraphs: [
              'AtollWire displays advertising to support our journalism. Advertisements are clearly labelled as "Sponsored" and are kept separate from our editorial content. Advertising partners may use their own cookies to measure ad performance.',
            ],
          },
          {
            heading: "Sharing of information",
            paragraphs: [
              "We do not sell your personal information. We may share limited data with service providers who help us run the website (such as hosting or analytics providers), under obligations to keep it confidential.",
            ],
          },
          {
            heading: "Your rights",
            paragraphs: [
              "You can ask us what personal information we hold about you, request a correction, or ask us to delete it, subject to any legal requirements to retain certain records.",
            ],
          },
          {
            heading: "Contact",
            paragraphs: [
              "For any privacy-related questions or requests, please reach out through the contact details listed on our homepage.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
