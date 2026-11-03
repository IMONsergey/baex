import { useLayoutEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Media } from "../components/Media";
import { getProject } from "../data";
import "../styles/work.css";

gsap.registerPlugin(ScrollTrigger);

export function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = getProject(slug);
  const nextProject = getProject(project?.nextProjectSlug);
  const page = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!project || !page.current) return;
    const motion = gsap.matchMedia();
    const context = gsap.context(() => {
      motion.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".project-caption-line > span", { yPercent: 110, opacity: 0 }, {
          yPercent: 0, opacity: 1, duration: 0.95, delay: 0.2, stagger: 0.08, ease: "power3.out",
        });
        gsap.to(".project-hero-media", {
          yPercent: 50, ease: "none",
          scrollTrigger: { trigger: ".project-hero", start: "top top", end: "bottom top", scrub: true },
        });
        if (nextProject) {
          gsap.fromTo(".project-next-image", { yPercent: -20 }, {
            yPercent: 0, ease: "none",
            scrollTrigger: { trigger: ".project-next-frame", start: "top bottom", end: "bottom bottom", scrub: true },
          });
        }
      });
    }, page);
    return () => { motion.revert(); context.revert(); };
  }, [project, nextProject]);

  if (!project) {
    return (
      <section className="project-not-found" data-theme="light">
        <h1>Project not found.</h1>
        <Link to="/work">Explore all projects <span aria-hidden="true">↗</span></Link>
      </section>
    );
  }

  return (
    <div className="project-page" ref={page}>
      <section className="project-hero" data-theme="dark" aria-labelledby="project-title">
        <h1 id="project-title" className="project-accessible-title">{project.title}</h1>
        <div className="project-hero-media"><Media media={project.hero} eager /></div>
        <div className="project-hero-grid">
          <div className="project-hero-caption">
            {project.heroCaption.split("\n").map((line, index) => (
              <span className="project-caption-line" key={index}><span>{line}</span></span>
            ))}
          </div>
        </div>
      </section>

      <div className={`project-content ${project.testimonial ? "has-testimonial" : "no-testimonial"}`} data-theme="light">
        <section className="project-introduction" aria-label="Project overview">
          <ul className="project-roles" aria-label="Services delivered">
            {project.roles.map((role) => <li key={role}>{role}</li>)}
          </ul>
          <div className="project-overview">
            <div className="project-introduction-copy">
              {project.introductionParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            {project.externalUrl && (
              <a className="project-external-link" href={project.externalUrl} target="_blank" rel="noreferrer noopener">
                <span>Visit website</span><span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </section>

        <section className="project-gallery" aria-label={`${project.title} project images and films`}>
          {project.gallery.map((media, index) => (
            <figure className={`project-asset is-${media.kind}`} key={`${media.assetKey}-${index}`}>
              <Media media={media} className="project-asset-media" />
            </figure>
          ))}
        </section>

        {project.testimonial && (
          <section className="project-testimonial" aria-label="Client perspective">
            <div className="project-testimonial-person">
              {project.testimonial.portrait && <div className="project-testimonial-portrait"><Media media={project.testimonial.portrait} /></div>}
              <p>{project.testimonial.nameParts.join("\n")}</p>
            </div>
            <p className="project-testimonial-copy">{project.testimonial.summary}</p>
          </section>
        )}

        {project.awards.length > 0 && (
          <section className="project-awards" aria-labelledby="project-awards-title">
            <h2 id="project-awards-title">Awards<br />&amp; recognitions</h2>
            <ul className="project-award-list">
              {project.awards.map((award, index) => (
                <li key={`${award.name}-${index}`}>
                  <span className="project-award-dots" aria-hidden="true"><i /><i /></span>
                  <div><p>{award.name}:</p><p>{award.entries.join("\n")}</p></div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {nextProject && (
        <section className="project-next" data-theme="light" aria-label="Next project">
          <div className="project-next-heading"><p>Next project</p><Link to="/work">All Projects <span aria-hidden="true">↗</span></Link></div>
          <Link to={nextProject.path} className="project-next-link" aria-label={`View next project: ${nextProject.title}`}>
            <div className="project-next-frame">
              <div className="project-next-image"><Media media={project.nextProjectImage ?? nextProject.hero} /></div>
              <span className="project-next-label" aria-hidden="true">
                <span className="project-next-name">{nextProject.title}</span>
                <span className="project-next-action">See project</span>
              </span>
            </div>
          </Link>
        </section>
      )}
    </div>
  );
}

export default ProjectPage;
