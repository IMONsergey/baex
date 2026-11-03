import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Media } from "../components/Media";
import { content, getProject } from "../data";
import type { WorkSlide } from "../data";
import "../styles/work.css";

gsap.registerPlugin(ScrollTrigger);

type ProjectSlide = Extract<WorkSlide, { type: "project" }>;
type ViewMode = "full" | "list";
type GalleryControls = { toggle: () => void; select: (index: number) => void };

const slides = content.work.slides;
const projectSlides = slides.filter((slide): slide is ProjectSlide => slide.type === "project");
const projectTitles = projectSlides.map((slide) => getProject(slide.projectSlug)?.title ?? slide.projectSlug);
const slideOffsets: number[] = [];
let totalUnits = 0;
for (const slide of slides) {
  slideOffsets.push(totalUnits);
  totalUnits += slide.type === "project" ? 1 : 0.75;
}
const projectOffsets = slides.flatMap((slide, index) => slide.type === "project" ? [slideOffsets[index]] : []);
const wrapIndex = (value: number) => ((value % projectSlides.length) + projectSlides.length) % projectSlides.length;

function useQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export function WorkPage() {
  const page = useRef<HTMLDivElement>(null);
  const scrollSpace = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const listLayer = useRef<HTMLDivElement>(null);
  const controls = useRef<GalleryControls | null>(null);
  const modeRef = useRef<ViewMode>("full");
  const selectedRef = useRef(0);
  const targetOffset = useRef(0);
  const smoothedOffset = useRef(0);
  const rowHeight = useRef(67);
  const drag = useRef({ id: -1, start: 0, last: 0, velocity: 0, moved: false });
  const suppressClickUntil = useRef(0);
  const [mode, setMode] = useState<ViewMode>("full");
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const desktop = useQuery("(min-width: 1024px)");
  const reducedMotion = useQuery("(prefers-reduced-motion: reduce)");
  const previewIndex = hovered ?? selected;

  useLayoutEffect(() => {
    const root = page.current;
    const space = scrollSpace.current;
    const view = canvas.current;
    const viewport = stage.current;
    const names = listLayer.current;
    if (!root || !space || !view || !viewport || !names) return;

    modeRef.current = "full";
    setMode("full");
    setHovered(null);

    let listTween: gsap.core.Timeline | undefined;
    let trigger: ScrollTrigger | undefined;
    let switching = false;
    let locked = false;
    let oldHtmlOverflow = "";
    let oldBodyOverflow = "";
    let oldScrollbarGutter = "";
    const slideNodes = Array.from(root.querySelectorAll<HTMLElement>(".work-slide"));
    const rowNodes = Array.from(root.querySelectorAll<HTMLElement>(".work-list-row"));
    const titleNodes = Array.from(root.querySelectorAll<HTMLElement>(".work-slide-title"));
    const rowLinks = rowNodes.map((node) => node.firstElementChild as HTMLElement);
    const indexNode = root.querySelector<HTMLElement>(".work-list-index");
    const preview = root.querySelector<HTMLElement>(".work-preview-layer");
    const fullSlides = root.querySelector<HTMLElement>(".work-slides");

    const unlock = () => {
      if (!locked) return;
      document.documentElement.style.overflow = oldHtmlOverflow;
      document.body.style.overflow = oldBodyOverflow;
      document.documentElement.style.scrollbarGutter = oldScrollbarGutter;
      locked = false;
    };
    const lock = () => {
      if (locked) return;
      oldHtmlOverflow = document.documentElement.style.overflow;
      oldBodyOverflow = document.body.style.overflow;
      oldScrollbarGutter = document.documentElement.style.scrollbarGutter;
      document.documentElement.style.scrollbarGutter = "stable";
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      locked = true;
    };
    const select = (index: number) => {
      const next = wrapIndex(index);
      if (selectedRef.current === next) return;
      selectedRef.current = next;
      setSelected(next);
    };
    const getHeight = () => viewport.clientHeight || window.innerHeight;
    const previewGeometry = () => {
      const height = getHeight();
      const width = viewport.clientWidth || document.documentElement.clientWidth;
      const previewHeight = height * 211 / width;
      return { width: 211, height: previewHeight, left: 40, top: (height - previewHeight) / 2 };
    };
    const sectionTop = () => space.getBoundingClientRect().top + window.scrollY;

    const paintFull = (pixels: number) => {
      const height = getHeight();
      slideNodes.forEach((node, index) => {
        const y = slideOffsets[index] * height - pixels;
        gsap.set(node, { y });
        const media = node.querySelector<HTMLElement>(".work-slide-media");
        const title = node.querySelector<HTMLElement>(".work-slide-heading");
        if (media) {
          gsap.set(media, {
            y: reducedMotion ? 0 : -y * 0.5,
            opacity: reducedMotion ? 1 : Math.max(0.35, 1 - Math.abs(y / height) * 0.5),
          });
        }
        if (title) gsap.set(title, { y: reducedMotion ? 0 : -y * 0.4 });
      });
      if (modeRef.current === "full") {
        let nearest = 0;
        projectOffsets.forEach((offset, index) => {
          if (Math.abs(offset * height - pixels) < Math.abs(projectOffsets[nearest] * height - pixels)) nearest = index;
        });
        select(nearest);
      }
    };

    const paintList = () => {
      const itemHeight = rowHeight.current;
      const total = itemHeight * rowNodes.length;
      rowNodes.forEach((node, index) => {
        const raw = index * itemHeight + smoothedOffset.current;
        const y = ((raw + total / 2) % total + total) % total - total / 2;
        gsap.set(node, { y: y - itemHeight / 2 });
      });
      select(Math.round(-smoothedOffset.current / itemHeight));
    };

    const context = gsap.context(() => {
      if (!reducedMotion) {
        gsap.fromTo(".work-intro-copy", { y: 34, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.9, delay: 0.15, ease: "power3.out",
        });
      }
      if (!desktop) return;
      gsap.set(rowLinks, { yPercent: 110 });
      gsap.set(rowNodes, { opacity: 0 });
      gsap.set(indexNode, { opacity: 0, y: 20 });
      gsap.set(preview, { autoAlpha: 0 });
      trigger = ScrollTrigger.create({
        trigger: space,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          if (modeRef.current === "full") paintFull(self.progress * (totalUnits - 1) * getHeight());
        },
        onRefresh: (self) => {
          rowHeight.current = rowNodes[0]?.offsetHeight || 67;
          if (modeRef.current === "full") paintFull(self.progress * (totalUnits - 1) * getHeight());
          else gsap.set(view, previewGeometry());
        },
      });
      paintFull(Math.max(0, Math.min(window.scrollY - sectionTop(), (totalUnits - 1) * getHeight())));

      controls.current = {
        select(index) {
          const current = Math.round(-targetOffset.current / rowHeight.current);
          const desired = wrapIndex(index);
          let difference = desired - wrapIndex(current);
          if (difference > projectSlides.length / 2) difference -= projectSlides.length;
          if (difference < -projectSlides.length / 2) difference += projectSlides.length;
          targetOffset.current -= difference * rowHeight.current;
          if (reducedMotion) smoothedOffset.current = targetOffset.current;
        },
        toggle() {
          if (switching) return;
          switching = true;
          setHovered(null);
          const duration = reducedMotion ? 0 : 1.2;
          listTween?.kill();

          if (modeRef.current === "full") {
            const current = selectedRef.current;
            rowHeight.current = rowNodes[0]?.offsetHeight || 67;
            targetOffset.current = smoothedOffset.current = -current * rowHeight.current;
            paintList();
            window.scrollTo({ top: sectionTop() + projectOffsets[current] * getHeight(), behavior: "instant" });
            paintFull(projectOffsets[current] * getHeight());
            modeRef.current = "list";
            setMode("list");
            lock();
            gsap.set(names, { visibility: "visible" });
            gsap.set(preview, { autoAlpha: 1 });
            gsap.set(fullSlides, { opacity: 0 });
            listTween = gsap.timeline({ onComplete: () => { switching = false; } });
            listTween.to(view, {
              ...previewGeometry(),
              duration, ease: "expo.inOut",
            }, 0);
            listTween.to(titleNodes, { opacity: 0, duration: reducedMotion ? 0 : 0.25 }, 0);
            listTween.to(rowLinks, {
              yPercent: 0, duration: reducedMotion ? 0 : 0.9,
              stagger: reducedMotion ? 0 : 0.018, ease: "expo.out",
            }, reducedMotion ? 0 : 0.35);
            listTween.to(rowNodes, {
              opacity: 1, duration: reducedMotion ? 0 : 0.9,
              stagger: reducedMotion ? 0 : 0.018, ease: "expo.out",
            }, reducedMotion ? 0 : 0.35);
            listTween.to(indexNode, { opacity: 1, y: 0, duration: reducedMotion ? 0 : 0.7 }, reducedMotion ? 0 : 0.4);
          } else {
            const current = selectedRef.current;
            if (names.contains(document.activeElement)) {
              root.querySelector<HTMLButtonElement>(".work-mode-toggle")?.focus({ preventScroll: true });
            }
            modeRef.current = "full";
            setMode("full");
            unlock();
            window.scrollTo({ top: sectionTop() + projectOffsets[current] * getHeight(), behavior: "instant" });
            paintFull(projectOffsets[current] * getHeight());
            gsap.set(fullSlides, { opacity: 1 });
            listTween = gsap.timeline({ onComplete: () => {
              gsap.set(preview, { autoAlpha: 0 });
              gsap.set(names, { visibility: "hidden" });
              gsap.set(rowLinks, { yPercent: 110 });
              switching = false;
              ScrollTrigger.update();
            } });
            listTween.to(rowLinks, {
              yPercent: -100, duration: reducedMotion ? 0 : 0.45,
              stagger: reducedMotion ? 0 : 0.012, ease: "power2.in",
            }, 0);
            listTween.to(rowNodes, {
              opacity: 0, duration: reducedMotion ? 0 : 0.45,
              stagger: reducedMotion ? 0 : 0.012, ease: "power2.in",
            }, 0);
            listTween.to(indexNode, { opacity: 0, y: 20, duration: reducedMotion ? 0 : 0.25 }, 0);
            listTween.to(view, { width: "100%", height: "100%", left: 0, top: 0, duration, ease: "expo.inOut" }, 0);
            listTween.to(preview, { autoAlpha: 0, duration: reducedMotion ? 0 : 0.25 }, reducedMotion ? 0 : 0.9);
            listTween.to(titleNodes, { opacity: 1, duration: reducedMotion ? 0 : 0.35 }, reducedMotion ? 0 : 0.8);
          }
        },
      };
    }, root);

    const tick = () => {
      if (!desktop || modeRef.current !== "list") return;
      const step = reducedMotion ? 1 : 1 - Math.exp(-0.13 * Math.min(3, gsap.ticker.deltaRatio(60)));
      smoothedOffset.current += (targetOffset.current - smoothedOffset.current) * step;
      paintList();
    };
    const onWheel = (event: WheelEvent) => {
      if (modeRef.current !== "list" || event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      targetOffset.current -= delta;
      setHovered(null);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (modeRef.current !== "list") return;
      const target = event.target as HTMLElement;
      if (target.matches("input,textarea,select")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        controls.current?.toggle();
      } else if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const current = Math.round(-targetOffset.current / rowHeight.current);
        const next = event.key === "Home" ? 0 : event.key === "End" ? projectSlides.length - 1
          : current + (event.key === "ArrowUp" || event.key === "PageUp" ? -1 : 1);
        controls.current?.select(next);
        setHovered(null);
      }
    };
    if (desktop) {
      gsap.ticker.add(tick);
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKey);
    }
    return () => {
      if (names.contains(document.activeElement)) viewport.focus({ preventScroll: true });
      listTween?.kill();
      trigger?.kill();
      gsap.ticker.remove(tick);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      controls.current = null;
      unlock();
      modeRef.current = "full";
      context.revert();
      gsap.set(view, { clearProps: "width,height,left,top" });
      gsap.set([names, indexNode, preview, fullSlides, ...titleNodes, ...rowLinks, ...rowNodes].filter(Boolean), {
        clearProps: "transform,opacity,visibility",
      });
      slideNodes.forEach((node) => {
        gsap.set(node, { clearProps: "transform" });
        const media = node.querySelector(".work-slide-media");
        const title = node.querySelector(".work-slide-heading");
        if (media) gsap.set(media, { clearProps: "transform,opacity" });
        if (title) gsap.set(title, { clearProps: "transform" });
      });
    };
  }, [desktop, reducedMotion]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (modeRef.current !== "list" || event.button !== 0) return;
    drag.current = { id: event.pointerId, start: event.clientY, last: event.clientY, velocity: 0, moved: false };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const pointer = drag.current;
    if (modeRef.current !== "list" || pointer.id !== event.pointerId) return;
    const delta = event.clientY - pointer.last;
    if (Math.abs(event.clientY - pointer.start) > 4) {
      pointer.moved = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (pointer.moved) {
      targetOffset.current += delta;
      pointer.velocity = delta;
      setHovered(null);
      event.preventDefault();
    }
    pointer.last = event.clientY;
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const pointer = drag.current;
    if (pointer.id !== event.pointerId) return;
    if (pointer.moved) {
      targetOffset.current += reducedMotion ? 0 : pointer.velocity * 8;
      suppressClickUntil.current = performance.now() + 250;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointer.id = -1;
  }
  function onListKey(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === " ") {
      event.preventDefault();
      controls.current?.select(selectedRef.current + (event.shiftKey ? -1 : 1));
    }
  }

  return (
    <div className="work-page" ref={page}>
      <section className="work-intro" data-theme="light">
        <h1 className="work-intro-copy"><span className="work-intro-indent" aria-hidden="true" />{content.work.intro}</h1>
      </section>
      <div className={`work-scroll-space is-${mode}`} ref={scrollSpace}
        style={{ "--work-length": totalUnits } as CSSProperties} data-theme="dark">
        <div className="work-stage" ref={stage} tabIndex={-1} role="region" aria-label="Project gallery">
          <div className="work-canvas" ref={canvas}>
            <div className="work-slides" aria-hidden={mode === "list"}>
              {slides.map((slide, index) => slide.type === "project" ? (
                <article className="work-slide work-slide-project" key={slide.projectSlug}>
                  <Link to={`/work/${slide.projectSlug}`} className="work-slide-link"
                    aria-label={`View ${getProject(slide.projectSlug)?.title ?? slide.projectSlug}`}
                    tabIndex={mode === "list" || (desktop && projectSlides.indexOf(slide) !== selected) ? -1 : undefined}>
                    <div className="work-slide-media"><Media media={slide.thumbnail} eager={index < 2} /></div>
                    <div className="work-slide-heading"><h2 className="work-slide-title">{getProject(slide.projectSlug)?.title}</h2></div>
                    <span className="work-slide-number">{String(projectSlides.indexOf(slide) + 1).padStart(2, "0")}</span>
                  </Link>
                </article>
              ) : (
                <section className="work-slide work-slide-statement" key={`statement-${index}`}>
                  <p>{slide.text}</p>
                </section>
              ))}
            </div>
            <div className="work-preview-layer" aria-hidden="true">
              {projectSlides.map((slide, index) => (
                <div key={slide.projectSlug} className={`work-preview ${index === previewIndex ? "is-active" : ""}`}>
                  <Media media={slide.thumbnail} />
                </div>
              ))}
            </div>
          </div>
          <div ref={listLayer} className="work-list-layer" aria-hidden={mode !== "list"}
            onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
            onClickCapture={(event) => {
              if (performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); }
            }}>
            <ul className="work-project-list" aria-label="Project list">
              {projectSlides.map((slide, index) => (
                <li key={slide.projectSlug} className={`work-list-row ${index === selected ? "is-centered" : ""} ${index === hovered ? "is-hovered" : ""}`}>
                  <Link to={`/work/${slide.projectSlug}`} onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onKeyDown={onListKey}
                    tabIndex={mode === "list" && index === selected ? 0 : -1}>
                    {projectTitles[index]}
                  </Link>
                </li>
              ))}
            </ul>
            <span className="work-list-index" aria-live="polite">{String(selected + 1).padStart(2, "0")}</span>
          </div>
          <div className="work-controls">
            <button className="work-mode-toggle" type="button" onClick={() => controls.current?.toggle()}
              aria-label={`${mode === "full" ? "List" : "Full"} view`} aria-pressed={mode === "list"}>
              <span className="work-mode-icon" aria-hidden="true"><i /><i /><i /></span>
              <span>{mode === "full" ? "List view" : "Full view"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkPage;
