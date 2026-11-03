import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { content, resolveMedia } from "../data";
import { getMediaDetails, useReducedMotion } from "./Media";
import brand from "../data/brand-map.json";
import "../styles/media.css";

export interface ReelProps {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}

const focusableSelector = "button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),video[controls],[tabindex]:not([tabindex='-1'])";

export function Reel({ open, onClose, returnFocusTo }: ReelProps) {
  const [present, setPresent] = useState(open);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [retryToken, setRetryToken] = useState("");
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();
  const titleId = useId();
  const overlay = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const initialized = useRef(false);
  const requestedClose = useRef(false);
  const onCloseRef = useRef(onClose);
  const openRef = useRef(open);
  const generation = useRef(0);
  onCloseRef.current = onClose;
  openRef.current = open;
  const media = content.site.reel;
  const localSource = resolveMedia(media);
  const details = getMediaDetails(media);
  const src = localSource ? `${localSource}${retryToken ? `?retry=${retryToken}` : ""}` : undefined;

  const requestClose = useCallback(() => {
    if (!openRef.current || requestedClose.current) return;
    requestedClose.current = true;
    video.current?.pause();
    onCloseRef.current();
  }, []);

  const play = useCallback(() => {
    const element = video.current;
    if (!element || !openRef.current || requestedClose.current || document.hidden) return;
    const token = ++generation.current;
    try {
      element.play()?.then(() => {
        if (token !== generation.current || !openRef.current || requestedClose.current || document.hidden) element.pause();
        else setBlocked(false);
      }).catch((error: unknown) => {
        if (token !== generation.current || !openRef.current || (error instanceof DOMException && error.name === "AbortError")) return;
        setBlocked(true);
      });
    } catch {
      setBlocked(true);
    }
  }, []);

  useEffect(() => {
    if (open) {
      requestedClose.current = false;
      setPresent(true);
      setFailed(false);
      setBlocked(false);
      setLoading(true);
    }
  }, [open]);

  useLayoutEffect(() => {
    const root = overlay.current;
    const panel = frame.current;
    const picture = visual.current;
    if (!present || !root || !panel || !picture) return;
    const timeline = gsap.timeline();
    const duration = reduced ? 0 : 1.8;
    if (open) {
      if (!initialized.current) {
        gsap.set(root, { opacity: reduced ? 1 : 0 });
        gsap.set(panel, { clipPath: reduced ? "inset(0%)" : "inset(50%)", rotate: reduced ? 0 : -30 });
        gsap.set(picture, { rotate: reduced ? 0 : 30, scale: reduced ? 1 : 1.2 });
        initialized.current = true;
      }
      timeline.to(root, { opacity: 1, duration: reduced ? 0 : 0.3 }, 0)
        .to(panel, { clipPath: "inset(0%)", rotate: 0, duration, ease: "expo.inOut" }, 0)
        .to(picture, { rotate: 0, scale: 1, duration, ease: "expo.inOut" }, 0);
    } else {
      ++generation.current;
      video.current?.pause();
      timeline.to(panel, { clipPath: "inset(50%)", rotate: reduced ? 0 : -30, duration, ease: "expo.inOut" }, 0)
        .to(picture, { rotate: reduced ? 0 : 30, scale: reduced ? 1 : 1.2, duration, ease: "expo.inOut" }, 0)
        .to(root, { opacity: 0, duration: reduced ? 0 : 0.25 }, Math.max(0, duration - 0.25))
        .call(() => { initialized.current = false; setPresent(false); });
    }
    return () => { timeline.kill(); };
  }, [open, present, reduced]);

  // Keep native video controls in the browser's tab order; focus guards surround
  // them rather than intercepting every Tab inside the browser's control shadow DOM.
  const focusEdge = useCallback((edge: "first" | "last") => {
    const root = overlay.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>(focusableSelector)]
      .filter((element) => !element.hasAttribute("data-reel-focus-guard") && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
    const target = edge === "first" ? items[0] : items[items.length - 1];
    (target ?? root).focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const root = overlay.current;
    if (!present || !root) return;
    // Pointer activation need not focus the button (notably in Safari), and a
    // click can focus its nested video. Keep the actual opener through exit.
    const previousFocus = returnFocusTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbar) document.body.style.paddingRight = `${padding + scrollbar}px`;
    const inertElements = [...document.body.children]
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== root && !element.contains(root))
      .map((element) => ({ element, previous: element.inert }));
    for (const { element } of inertElements) element.inert = true;
    const frameId = requestAnimationFrame(() => closeButton.current?.focus({ preventScroll: true }));
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const nativeVideo = video.current as (HTMLVideoElement & { webkitDisplayingFullscreen?: boolean }) | null;
      if (document.fullscreenElement || nativeVideo?.webkitDisplayingFullscreen) return;
      event.preventDefault();
      event.stopPropagation();
      requestClose();
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) focusEdge("first");
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", containFocus);
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", containFocus);
      for (const { element, previous } of inertElements) element.inert = previous;
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected && !previousFocus.closest("[inert]")) previousFocus.focus({ preventScroll: true });
    };
  }, [present, requestClose, focusEdge, returnFocusTo]);

  useEffect(() => {
    const element = video.current;
    if (!present || !element) return;
    if (open) play();
    else element.pause();
    return () => { ++generation.current; element.pause(); };
  }, [present, open, retryToken, play]);

  useEffect(() => {
    const element = video.current;
    if (!present || !element) return;
    let resume = false;
    const visibility = () => {
      if (document.hidden) { resume = !element.paused && !element.ended; element.pause(); }
      else if (resume && openRef.current) { resume = false; play(); }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [present, retryToken, play]);

  const retry = () => {
    setFailed(false);
    setBlocked(false);
    setLoading(true);
    setRetryToken(`${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  };

  if (!present || typeof document === "undefined") return null;

  return createPortal(
    <div ref={overlay} className={`reel${open ? " is-open" : " is-closing"}`} role="dialog" aria-modal="true"
      aria-labelledby={titleId} aria-busy={loading && !failed} tabIndex={-1} data-lenis-prevent="true"
      data-cursor="Close Reel" onWheel={(event) => event.stopPropagation()} onTouchMove={(event) => event.stopPropagation()}>
      <span data-reel-focus-guard="true" className="reel__focus-guard" tabIndex={0} onFocus={() => focusEdge("last")} />
      <h2 id={titleId} className="reel__accessible-title">{content.site.name} showreel</h2>
      <div ref={frame} className="reel__frame">
        <div ref={visual} className="reel__visual">
          {src && (
            <video key={retryToken} ref={video} className="reel__video" src={src}
              poster={details?.poster ?? details?.posterPublicPath} width={details?.width} height={details?.height}
              controls playsInline loop preload="auto" tabIndex={0} aria-label="Agency showreel" data-cursor=""
              onLoadedData={() => { setLoading(false); setFailed(false); }}
              onPlaying={() => { setLoading(false); setBlocked(false); }}
              onWaiting={() => setLoading(true)}
              onPause={() => setLoading(false)}
              onError={() => { setFailed(true); setLoading(false); }} />
          )}
        </div>
      </div>
      <button ref={closeButton} type="button" className="reel__close" onClick={requestClose} aria-label="Close reel" data-cursor="Close Reel">
        <img src={brand.close} alt="" aria-hidden="true" />
      </button>
      {(failed || !src) && (
        <div className="reel__message" role="status">
          <p>The reel could not be loaded.</p>
          {src && <button type="button" onClick={retry}>Try again</button>}
        </div>
      )}
      {blocked && !failed && src && <button type="button" className="reel__play" onClick={play}>Play reel</button>}
      <span data-reel-focus-guard="true" className="reel__focus-guard" tabIndex={0} onFocus={() => focusEdge("first")} />
    </div>, document.body,
  );
}

export default Reel;
