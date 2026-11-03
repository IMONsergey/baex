import { useRef, useState } from "react";
import { Media, useReducedMotion } from "../components/Media";
import { content } from "../data";
import { useEditorialMotion } from "../hooks/useEditorialMotion";
import "../styles/editorial.css";

export function AboutPage() {
  const root = useRef<HTMLElement>(null);
  const about = content.about;
  const [galleryPaused, setGalleryPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  useEditorialMotion(root);

  return (
    <article ref={root} className="editorial-page about-page" data-theme="light">
      <header className="editorial-opening about-opening" data-theme="light">
        <h1 className="editorial-display" data-editorial-reveal>{about.intro}</h1>
      </header>

      <section className="editorial-grid about-principles" data-theme="light">
        <h2 className="editorial-side-label">{about.principlesTitle}</h2>
        <div className="about-principles-content">
          <ol className="about-principles-list">
            {about.principles.map((principle) => (
              <li key={principle.number} data-editorial-reveal>
                <span className="about-principle-number">({principle.number})</span>
                <span>{principle.title}</span>
              </li>
            ))}
          </ol>
          <p className="about-principles-summary" data-editorial-reveal>{about.principlesSummary}</p>
        </div>
      </section>

      <section className="about-awards" aria-labelledby="about-awards-heading" data-theme="light">
        <div className="about-awards-heading">
          <h2 id="about-awards-heading">Awards</h2>
          <span className="about-awards-count">(x{about.awardsCount})</span>
        </div>
        <div className="editorial-grid about-awards-details">
          <p className="about-awards-label">{about.awardsTitle}</p>
          <ul className="about-awards-list">
            {about.awards.map((award) => (
              <li key={award.name}><span>{String(award.count).padStart(2, "0")}</span> x {award.name}</li>
            ))}
          </ul>
        </div>
      </section>

      {about.bigMedia && <section className="editorial-wide-media about-showreel" data-theme="light" aria-label="Selected studio work">
        <Media media={about.bigMedia} className="about-showreel-media" autoPlay />
      </section>}

      <section className="about-statement" data-theme="light">
        <p className="editorial-display" data-editorial-reveal>{about.statement}</p>
      </section>

      <section className="editorial-grid about-founder" aria-labelledby="about-founder-heading" data-theme="light">
        <h2 id="about-founder-heading" className="editorial-side-label about-sticky-label">One Founder</h2>
        <div className="about-founder-portrait" data-editorial-reveal>
          <Media media={about.founder.portrait} />
        </div>
        <div className="about-founder-copy" data-editorial-reveal>
          <p>{about.founder.summary}</p>
          <div className="about-person-credit">
            <h3>{about.founder.name}</h3>
            <p>{about.founder.role}</p>
          </div>
          <div className="about-founder-links">
            {about.founder.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener" className="editorial-text-link">
                {link.label}<span className="editorial-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-grid about-partners" aria-labelledby="about-partners-heading" data-theme="light">
        <h2 id="about-partners-heading" className="editorial-side-label about-sticky-label">+{about.partners.length} partners</h2>
        <div className="about-partners-grid">
          {about.partners.map((person) => (
            <figure className="about-partner" key={person.name} data-editorial-reveal>
              <Media media={person.portrait} className="about-partner-portrait" />
              <figcaption>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="about-approach" data-theme="dark">
        <div className="editorial-grid about-approach-grid">
          <h2 className="about-approach-title">{about.approachTitle}</h2>
          <div className="about-approach-content">
            {about.approach.map((section) => (
              <div className="about-approach-item" key={section.title} data-editorial-reveal>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </div>
            ))}
            <p className="about-collaboration-statement" data-editorial-reveal>{about.collaborationStatement}</p>
          </div>
        </div>
        <div className="about-approach-images">
          {about.approachMedia.map((item) => <Media key={item.assetKey} media={item} style={{ aspectRatio: "670 / 459" }} />)}
        </div>
      </section>

      <section className="about-team" aria-labelledby="about-team-heading" data-theme="light">
        <h2 id="about-team-heading" className="editorial-large-title" data-editorial-reveal>{about.teamTitle}</h2>
        <div className="about-team-gallery" tabIndex={reducedMotion ? 0 : undefined}>
          <div id="about-team-track" className="about-team-track" data-paused={galleryPaused}>
            {[0, 1].map((copy) => (
              <div className="about-team-group" key={copy} aria-hidden={copy === 1 ? true : undefined} inert={copy === 1}>
                {about.teamGallery.map((item) => (
                  <div className="about-team-image" key={item.assetKey}>
                    <Media media={copy === 1 ? { ...item, alt: "" } : item} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button className="about-team-motion" type="button" aria-controls="about-team-track" onClick={() => setGalleryPaused((paused) => !paused)}>
            {galleryPaused ? "Resume gallery" : "Pause gallery"}
          </button>
        </div>
      </section>

      <section className="about-careers" data-theme="light">
        <a href={`mailto:${about.careers.email}`} className="about-careers-link" data-editorial-reveal>
          <span>{about.careers.email}</span>
          <span className="editorial-large-title">{about.careers.label}</span>
        </a>
      </section>
    </article>
  );
}

export default AboutPage;
