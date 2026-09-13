"use client";

import Header from "@/components/en/Header";
import Nav from "@/components/en/Nav";
import Footer from "@/components/en/Footer";
import ContactForm from "@/components/en/ContactForm";

export default function EnContactPage() {
  return (
    <>
      <Header dvHref="/contact" />
      <Nav />
      <main>
        <div className="info-page">
          <h1>Contact Us</h1>
          <p className="contact-intro">
            Have a question, a story tip, or feedback? Send us a message using the form below, or email us
            directly — we&apos;ll get back to you as soon as we can.
          </p>

          <div className="contact-grid">
            <ContactForm />

            <div className="contact-info">
              <div className="contact-info-item">
                <h3>Email</h3>
                <p>
                  <a href="mailto:hello@atollwire.mv">hello@atollwire.mv</a>
                </p>
              </div>
              <div className="contact-info-item">
                <h3>News Tips</h3>
                <p>
                  <a href="mailto:news@atollwire.mv">news@atollwire.mv</a>
                </p>
              </div>
              <div className="contact-info-item">
                <h3>Advertising</h3>
                <p>
                  <a href="mailto:ads@atollwire.mv">ads@atollwire.mv</a>
                </p>
              </div>
              <div className="contact-info-item">
                <h3>Newsroom</h3>
                <p>Malé, Maldives</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .info-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 30px 24px 60px;
        }
        .info-page :global(h1) {
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: 30px;
          letter-spacing: -0.02em;
          margin: 4px 0 6px;
          line-height: 1.3;
        }
        .contact-intro {
          font-size: 16px;
          line-height: 1.75;
          color: var(--ink);
          margin-bottom: 30px;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        @media (min-width: 640px) {
          .contact-grid {
            grid-template-columns: 1.3fr 1fr;
          }
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .contact-info :global(.contact-info-item h3) {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .contact-info :global(.contact-info-item p) {
          font-size: 15px;
          line-height: 1.7;
          color: var(--ink-soft);
          margin: 0;
        }
        .contact-info :global(.contact-info-item a) {
          color: var(--teal);
          font-weight: 700;
        }
        .contact-info :global(.contact-info-item a:hover) {
          color: var(--coral);
        }
      `}</style>
    </>
  );
}
