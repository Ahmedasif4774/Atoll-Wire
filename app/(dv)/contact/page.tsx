"use client";

import Header from "@/components/dv/Header";
import Nav from "@/components/dv/Nav";
import Footer from "@/components/dv/Footer";
import ContactForm from "@/components/dv/ContactForm";

export default function DvContactPage() {
  return (
    <>
      <Header enHref="/en/contact" />
      <Nav />
      <main>
        <div className="info-page">
          <h1>ގުޅުއްވުމަށް</h1>
          <p className="contact-intro">
            ސުވާލެއް، ޚަބަރެއް، ނުވަތަ ފީޑްބެކެއް އޮތްނަމަ، ތިރީގައިވާ ފޯމު މެދުވެރިކޮށް ފޮނުއްވާ، ނުވަތަ ސީދާ
            އީމެއިލް ކުރައްވާ. އަޅުގަނޑުމެން ވީހާވެސް އަވަހަކަށް ޖަވާބުދޭނަން.
          </p>

          <div className="contact-grid">
            <ContactForm />

            <div className="contact-info">
              <div className="contact-info-item">
                <h3>އީމެއިލް</h3>
                <p>
                  <a href="mailto:hello@atollwire.mv">hello@atollwire.mv</a>
                </p>
              </div>
              <div className="contact-info-item">
                <h3>ނިއުސް ޓިޕް</h3>
                <p>
                  <a href="mailto:news@atollwire.mv">news@atollwire.mv</a>
                </p>
              </div>
              <div className="contact-info-item">
                <h3>އިޝްތިހާރު</h3>
                <p>
                  <a href="mailto:ads@atollwire.mv">ads@atollwire.mv</a>
                </p>
              </div>
              <div className="contact-info-item">
                <h3>ނޫސްއޮފީސް</h3>
                <p>މާލެ، ދިވެހިރާއްޖެ</p>
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
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 28px;
          font-weight: 700;
          margin: 4px 0 6px;
          line-height: 1.8;
        }
        .contact-intro {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 16px;
          line-height: 2.1;
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
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .contact-info :global(.contact-info-item p) {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 15px;
          line-height: 1.9;
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
