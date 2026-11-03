import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Media } from "../components/Media";
import { content, type EngagementModel } from "../data";
import { useEditorialMotion } from "../hooks/useEditorialMotion";
import "../styles/editorial.css";

function ModelSection({ model }: { model: EngagementModel }) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const isDark = model.id === "venture";
  const detailsIds = model.metrics.map((_, index) => `${model.id}-metric-${index}`).join(" ");

  return (
    <section
      id={model.id}
      className={`services-model services-model-${model.id}${detailsOpen ? "" : " services-details-collapsed"}`}
      data-theme={isDark ? "dark" : "light"}
      aria-labelledby={`${model.id}-heading`}
    >
      <h2 id={`${model.id}-heading`} className="services-model-title" data-editorial-reveal>{model.title}</h2>
      <p className="services-model-headline" data-editorial-reveal>{model.headline}</p>
      <div className="editorial-grid services-model-intro">
        <h3>{model.title} model.<br />{model.subtitle}.</h3>
        <div>
          <p>{model.description}</p>
          <Link to="/contact" className="editorial-text-link">Discuss a project<span className="editorial-arrow" aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <div className="services-metrics-heading">
        <span>The numbers.</span>
        <button type="button" aria-expanded={detailsOpen} aria-controls={detailsIds} onClick={() => setDetailsOpen((value) => !value)}>
          {detailsOpen ? "Close" : "Details"}
        </button>
      </div>
      <div className="services-metrics">
        {model.metrics.map((metric, index) => (
          <div className="services-metric" key={`${model.id}-${metric.sector}-${index}`}>
            <div className="services-metric-bar">
              {metric.logo && <Media media={metric.logo} className="services-metric-logo" />}
              <span className="services-metric-sector">{metric.sector}</span>
              <span className="services-metric-value">{metric.value}</span>
            </div>
            <ul id={`${model.id}-metric-${index}`} className="services-metric-stages">
              {metric.stages.map((stage) => <li key={stage}>{stage}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServicesPage() {
  const root = useRef<HTMLElement>(null);
  const services = content.services;
  useEditorialMotion(root);

  return (
    <article ref={root} className="editorial-page services-page" data-theme="light">
      <header className="editorial-opening" data-theme="light">
        <h1 className="editorial-display" data-editorial-reveal>{services.intro}</h1>
      </header>

      <section className="editorial-grid services-capabilities" aria-labelledby="services-capabilities-heading" data-theme="light">
        <h2 id="services-capabilities-heading" className="editorial-side-label"><span>Capabilities</span></h2>
        <div className="services-capability-list">
          {services.capabilities.map((capability) => (
            <div className="services-capability" key={capability.number} data-editorial-reveal>
              <h3>({capability.number}) {capability.title}</h3>
              <ul>{capability.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {services.bigMedia && <section className="editorial-wide-media services-feature" aria-label="Motion design" data-theme="light">
        <Media media={services.bigMedia} className="services-feature-media" autoPlay />
      </section>}

      <div className="services-models">
        <nav className="services-model-nav" aria-label="Engagement models" data-theme="light">
          <p>{services.modelsTitle}</p>
          {services.models.map((model, index) => (
            <a key={model.id} href={`#${model.id}`}>
              <span className="services-model-nav-number">({String(index + 1).padStart(2, "0")})</span>
              <span><span className="services-model-nav-title">{model.title}<span className="editorial-arrow" aria-hidden="true">↗</span></span><span className="services-model-nav-subtitle">{model.subtitle}</span></span>
            </a>
          ))}
        </nav>
        {services.models.map((model) => <ModelSection key={model.id} model={model} />)}
      </div>

      <section className="services-testimonials" aria-labelledby="services-testimonials-heading" data-theme="light">
        <h2 id="services-testimonials-heading" className="editorial-large-title" data-editorial-reveal>{services.testimonialsTitle}</h2>
        <div className="services-testimonial-grid">
          {services.testimonials.map((person) => (
            <figure className="services-testimonial" key={person.name} data-editorial-reveal>
              {person.portrait && <Media media={person.portrait} className="services-testimonial-portrait" style={{ aspectRatio: "355 / 217" }} />}
              <figcaption>
                <div className="services-testimonial-person"><span>{person.name}</span><span>{person.role}</span></div>
                <p>{person.summary}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="editorial-grid services-faq" aria-labelledby="services-faq-heading" data-theme="light">
        <h2 id="services-faq-heading">{services.faqTitle}</h2>
        <ol>
          {services.faqs.map((faq, index) => (
            <li key={faq.question} data-editorial-reveal>
              <span className="services-faq-number">({String(index + 1).padStart(2, "0")})</span>
              <div><h3>{faq.question}</h3><p>{faq.answer}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="services-contact" data-theme="light">
        <Link to={services.contact.path} className="editorial-large-title editorial-text-link">{services.contact.label}<span className="editorial-arrow" aria-hidden="true">↗</span></Link>
      </section>
    </article>
  );
}

export default ServicesPage;
