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
        ✓ Thank you! Your message has been received. We'll get back to you soon.
      </div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Your name" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="you@example.com" required />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" placeholder="Write your message here..." required />
        </div>
        <button type="submit" className="contact-submit">
          Send Message
        </button>
        <p className="form-note">This is a demo form — messages are not sent to a server.</p>
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
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
        }
        .form-group input,
        .form-group textarea {
          font-size: 15px;
          color: var(--ink);
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          border-color: var(--teal);
        }
        .form-group textarea {
          resize: vertical;
          min-height: 140px;
          line-height: 1.6;
        }
        .contact-submit {
          font-family: "Archivo", sans-serif;
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
        }
        .form-success.show {
          display: block;
          margin-bottom: 18px;
        }
      `}</style>
    </div>
  );
}
