import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { content, getProject, resolveMedia } from "../data";
import type { GlanceCard } from "../data";
import brand from "../data/brand-map.json";
import { Media, useReducedMotion } from "../components/Media";
import { Wordmark } from "../components/Wordmark";
import { usePageMotion } from "../hooks/usePageMotion";
import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger);

function FeaturedProject({ item, index }: { item: typeof content.home.selected[number]; index: number }) {
  const link = useRef<HTMLAnchorElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [previewCapable, setPreviewCapable] = useState(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  const project = getProject(item.projectSlug);
  const centerPreview = () => {
    if (!link.current || !preview.current) return;
    gsap.killTweensOf(preview.current);
    gsap.set(preview.current, { x: link.current.clientWidth / 2, y: link.current.clientHeight / 2 });
  };
  const leavePreview = () => {
    const keyboardFocus = Boolean(link.current?.matches(":focus-visible"));
    setHovered(false);
    setFocused(keyboardFocus);
    if (keyboardFocus) centerPreview();
  };
  const move = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!link.current || !preview.current || !previewCapable || event.pointerType === "touch" || reduced) return;
    const bounds = link.current.getBoundingClientRect();
    gsap.to(preview.current, { x: event.clientX - bounds.left, y: event.clientY - bounds.top, duration: .65, ease: "power3.out", overwrite: "auto" });
  };
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      setPreviewCapable(query.matches);
      if (!query.matches) { setHovered(false); setFocused(false); }
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => () => { if (preview.current) gsap.killTweensOf(preview.current); }, []);
  if (!project) return null;
  return <Link ref={link} to={project.path} className={`featured-project${item.large ? " featured-project--large" : ""}`} onPointerMove={move}
    onPointerEnter={event => { if (event.pointerType !== "touch" && previewCapable && !reduced) { setHovered(true); move(event); } }}
    onPointerLeave={leavePreview}
    onPointerCancel={leavePreview}
    onFocus={event => {
      if (!previewCapable || reduced || !event.currentTarget.matches(":focus-visible")) return;
      centerPreview();
      setFocused(true);
    }}
    onBlur={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    aria-label={`View ${project.title} case study`}>
    <Media media={item.thumbnail} className="featured-project__image" />
    <img className="featured-project__logo" src={resolveMedia(item.logo)} alt={project.title} />
    <div ref={preview} className="featured-project__preview" aria-hidden="true">
      <div className="featured-project__preview-inner"><Media media={item.hoverVideo} active={previewCapable && !reduced && (hovered || focused)} /><span>Case study {String(index + 1).padStart(2, "0")} <b>↗</b></span></div>
    </div>
    <span className="featured-project__mobile-label">{project.title}<span>↗</span></span>
  </Link>;
}

function OfficeClocks({ tick }: { tick: number }) {
  return <article className="glance-card glance-card--small glance-card--dark glance-clocks">
    <h3>Two locations.<br />One perspective.</h3>
    <div className="glance-clocks__faces">{content.site.offices.map(office => {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: office.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(tick));
      const part = (type: string) => Number(parts.find(item => item.type === type)?.value ?? 0);
      const hour = part("hour"), minute = part("minute"), second = part("second");
      return <div className="glance-clock" key={office.city}>
        <div className="glance-clock__face" aria-hidden="true"><img src={brand.clockFace} alt="" /><span className="glance-clock__hour" style={{ transform: `rotate(${hour * 30 + minute / 2}deg)` }} /><span className="glance-clock__minute" style={{ transform: `rotate(${minute * 6 + second / 10}deg)` }} /><i /></div>
        <span>{office.city}</span><time>{`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`}</time>
      </div>;
    })}</div>
  </article>;
}

function GlanceWidget({ card, tick, duplicate }: { card: GlanceCard; tick: number; duplicate: boolean }) {
  const reduced = useReducedMotion();
  const frame = reduced ? 0 : Math.floor(tick / 2600);
  return <article className={`glance-card glance-card--${card.size} glance-card--${card.theme} glance-card--${card.variant}`}>
    {card.background && <Media media={card.background} className="glance-card__background" />}
    <div className="glance-card__content">
      {card.variant === "drive" ? <>
        <div className="glance-gauge" aria-hidden="true"><div className="glance-gauge__ticks">{Array.from({ length: 29 }, (_, index) => <i key={index} style={{ transform: `rotate(${-90 + index * 180 / 28}deg)`, opacity: index < 23 ? 1 : .18 }} />)}</div><span className="glance-gauge__needle" /></div>
        <h3 className="glance-card__value">{card.title}</h3><p className="glance-card__subtitle">{card.subtitle}</p>
      </> : <>
        <h3>{card.title}</h3>
        {!!card.logos.length && <div className="glance-card__logo"><img key={frame % card.logos.length} src={resolveMedia(card.logos[frame % card.logos.length])} alt="" /></div>}
        {!!card.items?.length && <div className="glance-card__industry"><span key={frame % card.items.length}>{card.items[frame % card.items.length]}</span></div>}
      </>}
      {card.link && <Link className="glance-card__link text-link" to={card.link.path} tabIndex={duplicate ? -1 : undefined}>{card.link.label}<span aria-hidden="true">↗</span></Link>}
    </div>
  </article>;
}

function GlanceRail() {
  const rail = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const drag = useRef<{ active: boolean; x: number; start: number; moved: number }>({ active: false, x: 0, start: 0, moved: 0 });
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setTick(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const node = rail.current;
    if (!node || !group.current || reduced) return;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(node);
    const animate = (_time: number, delta: number) => {
      if (!visible || paused.current || drag.current.active || document.hidden || !group.current) return;
      const width = group.current.offsetWidth;
      if (!width) return;
      node.scrollLeft += Math.min(delta, 48) * .035;
      if (node.scrollLeft >= width) node.scrollLeft -= width;
    };
    gsap.ticker.add(animate);
    return () => { observer.disconnect(); gsap.ticker.remove(animate); };
  }, [reduced]);
  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = rail.current;
    if (!node || !drag.current.active || event.pointerType !== "mouse") return;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(event.clientX - drag.current.x));
    if (drag.current.moved > 5) { node.setPointerCapture(event.pointerId); node.scrollLeft = drag.current.start - (event.clientX - drag.current.x); }
  };
  return <div ref={rail} className="glance-rail" aria-label="Studio at a glance. Scroll horizontally to explore." tabIndex={0}
    onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; }}
    onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }}
    onPointerDown={event => { drag.current = { active: true, x: event.clientX, start: event.currentTarget.scrollLeft, moved: 0 }; }}
    onPointerMove={pointerMove} onPointerUp={() => { drag.current.active = false; }} onPointerCancel={() => { drag.current.active = false; }}
    onClickCapture={event => { if (drag.current.moved > 5) { event.preventDefault(); event.stopPropagation(); drag.current.moved = 0; } }}>
    {[false, true].map(duplicate => <div ref={duplicate ? undefined : group} className="glance-rail__group" key={String(duplicate)} aria-hidden={duplicate || undefined} inert={duplicate || undefined}>
      {content.home.glanceCards.map((card, index) => <div className="glance-rail__cell" key={card.id}>
        <GlanceWidget card={card} tick={tick} duplicate={duplicate} />
        {index === 3 && <OfficeClocks tick={tick} />}
      </div>)}
    </div>)}
  </div>;
}

export function HomePage({ onOpenReel }: { onOpenReel: (opener: HTMLButtonElement) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const reel = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  usePageMotion(root);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    if (!root.current || reduced) return;
    const context = gsap.context(() => {
      gsap.fromTo(".wordmark-letter", { yPercent: -115 }, { yPercent: 0, duration: 2.3, stagger: { amount: .3, from: "end" }, ease: "expo.out" });
      gsap.to(".home-hero__wordmark", { y: () => (hero.current?.offsetHeight ?? 700) * .5, ease: "none", scrollTrigger: { trigger: hero.current, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
    }, root);
    return () => context.revert();
  }, [reduced]);
  const home = content.home;
  return <div ref={root} className="home-page">
    <section className="home-hero" ref={hero} data-theme="dark" aria-label="REJOUICE studio">
      <h1 className="home-hero__wordmark"><Wordmark /></h1>
      <div className="home-hero__bottom"><p>{home.hero.left}</p><p>{home.hero.right}</p><button type="button" aria-label="Scroll to showreel" onClick={() => reel.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })}><img src={brand.downArrow} alt="" /></button></div>
    </section>
    <button ref={reel} className="home-reel" type="button" onClick={event => onOpenReel(event.currentTarget)} aria-label="Play full showreel" data-theme="dark">
      <Media media={mobile ? home.hero.mobileVideo : home.hero.desktopVideo} eager />
      <span>Showreel</span>
    </button>
    <section className="home-intro" data-theme="dark">
      <p className="home-intro__statement" data-reveal>{home.intro}</p>
      <div className="home-key-value" data-reveal><h2>{home.keyValue.title}</h2><div><p>{home.keyValue.body}</p><Link className="text-link" to={home.keyValue.link.path}>{home.keyValue.link.label}<span aria-hidden="true">↗</span></Link></div></div>
    </section>
    <section className="home-selected" aria-labelledby="selected-title" data-theme="dark">
      <header className="home-section-label"><h2 id="selected-title">{home.selectedTitle}</h2><Link className="text-link" to="/work">See work<span aria-hidden="true">↗</span></Link></header>
      <div className="home-selected__grid">{home.selected.map((item, index) => <FeaturedProject item={item} index={index} key={item.projectSlug} />)}</div>
    </section>
    <section className="home-clients" aria-label="Selected clients">{home.logos.map(logo => <img key={logo.assetKey} src={resolveMedia(logo)} alt={logo.name.replace(/.*_/, "").replace(/\.svg$/, "")} loading="lazy" />)}</section>
    <section className="home-glance" aria-labelledby="glance-title"><header className="home-section-label"><h2 id="glance-title">{home.glanceTitle}</h2><span className="glance-drag-hint">Drag to explore <span aria-hidden="true">↔</span></span></header><GlanceRail /></section>
    <section className="home-approach"><h2 data-reveal>{home.approachTitle}</h2>{home.approach.map(item => <div className="home-approach__row" data-reveal key={item.title}><h3>{item.title}</h3><p>{item.body}</p></div>)}</section>
    <section className="home-portfolio-film" aria-label="A selection of the studio's work"><Media media={home.reel} /></section>
    <section className="home-next"><Link className="text-link" to={home.next.path} data-reveal>{home.next.title}<span aria-hidden="true">↗</span></Link></section>
  </div>;
}

export default HomePage;
