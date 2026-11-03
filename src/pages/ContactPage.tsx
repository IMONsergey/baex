import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Media } from "../components/Media";
import { content } from "../data";
import { useEditorialMotion } from "../hooks/useEditorialMotion";
import "../styles/editorial.css";

const timeFormatters = new Map(content.contact.offices.map((office) => [office.timeZone, new Intl.DateTimeFormat("en-US", {
  timeZone: office.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
})]));

export function ContactPage() {
  const root = useRef<HTMLElement>(null);
  const contact = content.contact;
  const [now, setNow] = useState(() => new Date());
  useEditorialMotion(root);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <article ref={root} className="editorial-page contact-page" data-theme="dark">
      <header className="editorial-opening" data-theme="dark">
        <h1 className="editorial-display" data-editorial-reveal>{contact.intro}</h1>
      </header>

      <section className="contact-information" aria-label="Contact details" data-theme="dark">
        <div className="contact-information-row">
          <h2 className="contact-row-label">{contact.title}</h2>
          {contact.channels.map((channel, index) => (
            <div className={`contact-row-detail contact-channel-${index}`} key={channel.email}>
              <h3>{channel.label}</h3>
              <a href={`mailto:${channel.email}`} className="contact-email">{channel.email}</a>
            </div>
          ))}
        </div>
        {contact.offices.map((office) => (
          <div className="contact-information-row" key={office.city}>
            <h2 className="contact-row-label">{office.city}</h2>
            <address className="contact-row-detail contact-office-address">{office.address.map((line) => <span key={line}>{line}</span>)}</address>
            <time className="contact-row-detail contact-office-time" dateTime={now.toISOString()} aria-label={`${office.city}: ${timeFormatters.get(office.timeZone)?.format(now)}`}>
              {timeFormatters.get(office.timeZone)?.format(now)}
            </time>
          </div>
        ))}
      </section>

      <section className="contact-work" data-theme="dark">
        <Link to={contact.next.path} className="contact-work-link">
          {contact.workImage && <Media media={contact.workImage} className="contact-work-image" />}
          <span className="contact-work-copy"><span>{contact.next.label}</span><span className="editorial-large-title">{contact.next.title}</span></span>
        </Link>
      </section>
    </article>
  );
}

export default ContactPage;
