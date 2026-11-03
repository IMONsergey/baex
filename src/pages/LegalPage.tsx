import { Link } from "react-router-dom";
import { content } from "../data";
import "../styles/editorial.css";

export function LegalPage() {
  return (
    <article className="editorial-page editorial-legal" data-theme="light">
      <h1>{content.legal.title}</h1>
      <div className="editorial-legal-body">
        {content.legal.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <div className="editorial-legal-links">
          <a className="editorial-text-link" href={content.legal.sourceTermsUrl} target="_blank" rel="noreferrer noopener">Source terms<span className="editorial-arrow" aria-hidden="true">↗</span></a>
          <Link className="editorial-text-link" to="/">Return home<span className="editorial-arrow" aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </article>
  );
}

export default LegalPage;
