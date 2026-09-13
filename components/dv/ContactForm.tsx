"use client";

import { useState } from "react";

// Demo-only form — matches the original static site, which never actually
// sent anywhere either. Wire this up to a real endpoint (or the Sanity
// Phase 5 "contact form" backend logic) when that's ready.
export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    e.currentTarget.reset();
  }

  return (
    <div>
      <div className={`form-success${submitted ? " show" : ""}`}>
        ✓ ޝުކުރިއްޔާ! ތިޔަ ފަރާތުގެ މެސެޖު ލިބިއްޖެ. އަޅުގަނޑުމެން އަވަހަށް ޖަވާބުދޭނަން.
      </div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">ނަން</label>
          <input type="text" id="name" name="name" placeholder="ތިޔަ ފަރާތުގެ ނަން" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">އީމެއިލް</label>
          <input type="email" id="email" name="email" placeholder="you@example.com" required />
        </div>
        <div className="form-group">
          <label htmlFor="message">މެސެޖު</label>
          <textarea id="message" name="message" placeholder="ތިޔަ ފަރާތުގެ މެސެޖު މިތާ ލިޔުއްވާ..." required />
        </div>
        <button type="submit" className="contact-submit">
          މެސެޖު ފޮނުވާ
        </button>
        <p className="form-note">މި ފޯމަކީ ޑިމޯ ފޯމެއް — ފޮނުވި މެސެޖު ސާރވަރަކަށް ނުދޭ.</p>
      </form>

      <style jsx>{`
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
        }
        .form-group input,
        .form-group textarea {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-size: 15px;
          color: var(--ink);
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.2s ease;
          direction: rtl;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          border-color: var(--teal);
        }
        .form-group textarea {
          resize: vertical;
          min-height: 140px;
          line-height: 1.9;
        }
        .contact-submit {
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: #fff;
          background: var(--teal);
          border: none;
          border-radius: 999px;
          padding: 13px 26px;
          cursor: pointer;
          width: fit-content;
          transition: opacity 0.2s ease;
        }
        .contact-submit:hover {
          opacity: 0.9;
        }
        .form-note {
          font-size: 13px;
          color: var(--ink-soft);
          margin-top: 4px;
        }
        .form-success {
          display: none;
          background: var(--sea-dim);
          border: 1px solid var(--teal);
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 15px;
          color: var(--ink);
          font-family: "MV Waheed", "Noto Sans Thaana", sans-serif;
        }
        .form-success.show {
          display: block;
          margin-bottom: 18px;
        }
      `}</style>
    </div>
  );
}
