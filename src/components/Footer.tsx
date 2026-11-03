import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink } from "react-router-dom";
import { content } from "../data";
import brand from "../data/brand-map.json";
import "../styles/shell.css";

export function Footer() {
  const inputId = useId();
  const messageId = useId();
  const email = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = email.current;
    if (!input) return;
    const value = input.value.trim();
    input.value = value;
    if (!value || !input.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setInvalid(true);
      setMessage("Enter a valid email address.");
      input.focus();
      return;
    }
    setInvalid(false);
    setMessage("Newsletter is not connected in this reference edition.");
  }

  return (
    <footer className="site-footer" data-theme="dark">
      <div className="site-footer-top">
        <div className="footer-message">
          <h2 className="footer-tagline">{content.site.footerTitle}</h2>
          <div className="footer-business"><span>New Business:</span><a href={`mailto:${content.site.businessEmail}`}>{content.site.businessEmail}</a></div>
          <form className="footer-newsletter" onSubmit={submit} noValidate>
            <label htmlFor={inputId}>{content.site.newsletter.label}</label>
            <div className="footer-email-field">
              <input ref={email} id={inputId} name="email" type="email" autoComplete="email" inputMode="email" required
                placeholder={content.site.newsletter.placeholder} aria-invalid={invalid || undefined} aria-describedby={message ? messageId : undefined}
                onChange={() => { if (message) setMessage(""); if (invalid) setInvalid(false); }} />
              <button type="submit" aria-label="Submit newsletter email"><span aria-hidden="true">→</span></button>
            </div>
            <p id={messageId} className={`footer-newsletter-message ${invalid ? "is-invalid" : ""}`} role="status" aria-live="polite">{message}</p>
          </form>
        </div>
        <nav className="footer-links" aria-label="Footer navigation"><ul>{content.site.nav.map((item) => (
          <li key={item.path}><NavLink to={item.path} end={item.path === "/"}>{item.label}</NavLink></li>
        ))}</ul></nav>
        <ul className="footer-socials">{content.site.socials.map((item) => (
          <li key={item.url}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.label}<span aria-hidden="true">↗</span></a></li>
        ))}</ul>
        <div className="footer-offices">{content.site.offices.map((office) => <p key={office.city}>{office.city}-{office.country}</p>)}</div>
        <div className="footer-legal"><Link to="/legal">Reference information</Link><span>©13-26</span></div>
      </div>
      <div className="footer-wordmark"><img src={brand.footerWordmark} alt={content.site.name} width="1358" height="217" loading="lazy" /></div>
    </footer>
  );
}

export default Footer;
