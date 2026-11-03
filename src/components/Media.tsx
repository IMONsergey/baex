import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEventHandler } from "react";
import { resolveMedia } from "../data";
import type { MediaRef } from "../data";
import assetDetails from "../data/asset-details.json";
import { useMediaPlaybackSuspended } from "./MediaPlayback";
import "../styles/media.css";

export interface MediaDetails {
  src: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  hasAudio?: boolean;
  poster?: string;
  posterPublicPath?: string;
}

const detailsByKey = assetDetails as Readonly<Record<string, MediaDetails>>;
export const getMediaDetails = (media: MediaRef): MediaDetails | undefined => detailsByKey[media.assetKey];

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export interface MediaProps {
  media: MediaRef;
  className?: string;
  eager?: boolean;
  /** False withholds the video source and stops playback (for hidden previews). */
  active?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onReady?: () => void;
}

function MediaAsset({ media, className = "", eager = false, active = true, autoPlay = true, controls = false, style, onClick, onReady }: MediaProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;
  const notifiedReady = useRef(false);
  const playGeneration = useRef(0);
  const desiredPlay = useRef(false);
  const suspended = useMediaPlaybackSuspended();
  const playbackAvailable = useRef(active && !suspended);
  const reduced = useReducedMotion();
  const localSource = resolveMedia(media);
  const details = getMediaDetails(media);
  const width = details?.width ?? media.width;
  const height = details?.height ?? media.height;
  const poster = details?.poster ?? details?.posterPublicPath;
  const isVideo = media.kind === "video";
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const [insideLink, setInsideLink] = useState(true);
  const [inactiveAncestor, setInactiveAncestor] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryToken, setRetryToken] = useState("");
  const [manualPlay, setManualPlay] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const src = localSource ? `${localSource}${retryToken ? `?retry=${retryToken}` : ""}` : undefined;
  const loadVideo = near && active;

  useEffect(() => {
    const node = wrapper.current;
    if (!node) return;
    setInsideLink(Boolean(node.parentElement?.closest("a,button,[role='button']")));
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      setVisible(true);
      return;
    }
    const loadingObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        loadingObserver.disconnect();
      }
    }, { rootMargin: "600px 0px", threshold: 0 });
    const playbackObserver = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting && entry.intersectionRatio > 0;
      if (!inView) { desiredPlay.current = false; ++playGeneration.current; video.current?.pause(); }
      setVisible(inView);
    }, { threshold: [0, 0.01] });
    loadingObserver.observe(node);
    playbackObserver.observe(node);
    return () => { loadingObserver.disconnect(); playbackObserver.disconnect(); };
  }, []);

  useEffect(() => {
    const node = wrapper.current;
    if (!node) return;
    const update = () => setInactiveAncestor(Boolean(node.closest("[inert],[aria-hidden='true']")));
    update();
    const observer = new MutationObserver(update);
    for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
      observer.observe(parent, { attributes: true, attributeFilter: ["inert", "aria-hidden"] });
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) { setManualPlay(false); setManualPause(false); }
  }, [reduced]);

  useEffect(() => {
    const update = () => {
      if (document.hidden) { desiredPlay.current = false; ++playGeneration.current; video.current?.pause(); }
      setTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const markReady = useCallback(() => {
    setReady(true);
    setFailed(false);
    if (!notifiedReady.current) {
      notifiedReady.current = true;
      readyCallback.current?.();
    }
  }, []);

  const playSafely = useCallback((element: HTMLVideoElement) => {
    if (!desiredPlay.current || !playbackAvailable.current || document.hidden || !element.getAttribute("src")) return;
    const generation = ++playGeneration.current;
    try {
      const result = element.play();
      result?.then(() => {
        if (!desiredPlay.current || !playbackAvailable.current || document.hidden) element.pause();
        else if (generation === playGeneration.current) setBlocked(false);
        // A stale success must not pause a newer, still-authorized play request.
      }).catch((error: unknown) => {
        if (generation !== playGeneration.current || (error instanceof DOMException && error.name === "AbortError")) return;
        if (desiredPlay.current && playbackAvailable.current && !document.hidden) setBlocked(true);
      });
    } catch {
      if (desiredPlay.current && playbackAvailable.current) setBlocked(true);
    }
  }, []);

  useLayoutEffect(() => {
    playbackAvailable.current = active && !suspended;
    const element = video.current;
    if (!element || !isVideo) return;
    const shouldPlay = active && !suspended && near && visible && tabVisible && !failed && !manualPause && ((autoPlay && !reduced) || manualPlay);
    desiredPlay.current = shouldPlay;
    if (shouldPlay) playSafely(element);
    else {
      ++playGeneration.current;
      element.pause();
      // React has removed src for an inactive preview. Reset its resource
      // selection too, so a pointer leave cancels an in-flight video download.
      if (!active) element.load();
    }
    return () => { desiredPlay.current = false; ++playGeneration.current; element.pause(); };
  }, [active, suspended, near, visible, tabVisible, failed, manualPause, manualPlay, autoPlay, reduced, isVideo, retryToken, playSafely]);

  useEffect(() => {
    const element = video.current;
    return () => {
      if (!element) return;
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [retryToken]);

  const retry = () => {
    notifiedReady.current = false;
    setReady(false);
    setFailed(false);
    setBlocked(false);
    setRetryToken(`${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  };

  const togglePlayback = () => {
    const element = video.current;
    if (!element || !playbackAvailable.current || !visible || document.hidden) return;
    if (!element.paused) {
      desiredPlay.current = false;
      ++playGeneration.current;
      setManualPause(true);
      setManualPlay(false);
      element.pause();
    } else {
      setManualPause(false);
      setManualPlay(true);
      setNear(true);
      desiredPlay.current = true;
      if (element.getAttribute("src")) playSafely(element);
    }
  };

  const showToggle = isVideo && active && !suspended && near && !failed && !controls && !onClick && !insideLink && !inactiveAncestor && (reduced || !autoPlay || blocked || manualPause);
  const error = !localSource || failed;
  const intrinsicStyle: CSSProperties = width && height ? { aspectRatio: `${width} / ${height}` } : {};

  return (
    <div
      ref={wrapper}
      className={`media media--${media.kind}${ready ? " is-ready" : ""}${error ? " has-error" : ""} ${className}`.trim()}
      style={{ ...intrinsicStyle, ...style }}
      data-media-key={media.assetKey}
      data-media-active={active}
      data-media-suspended={suspended}
      data-media-state={error ? "error" : ready ? "ready" : "loading"}
      aria-busy={!error && !ready}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? media.alt : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        event.currentTarget.click();
      } : undefined}
    >
      {localSource && !isVideo && (
        <img key={retryToken} className="media__image" src={src} alt={media.alt} width={width} height={height}
          loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async"
          onLoad={markReady} onError={() => setFailed(true)} />
      )}
      {localSource && isVideo && (
        <video key={retryToken} ref={video} className="media__video" src={loadVideo ? src : undefined}
          poster={loadVideo ? poster : undefined} width={width} height={height} preload={loadVideo ? "metadata" : "none"}
          muted loop playsInline controls={controls} tabIndex={controls ? 0 : -1} aria-label={media.alt}
          onLoadedMetadata={markReady} onLoadedData={markReady}
          onPlaying={(event) => {
            if (!desiredPlay.current || !playbackAvailable.current || document.hidden) { event.currentTarget.pause(); return; }
            setPlaying(true); setBlocked(false); markReady();
          }}
          onPause={() => {
            setPlaying(false);
            if (controls && desiredPlay.current && playbackAvailable.current && visible && !document.hidden) setManualPause(true);
          }}
          onPlay={(event) => {
            if (!playbackAvailable.current || !visible || document.hidden || (!controls && !desiredPlay.current)) {
              desiredPlay.current = false;
              ++playGeneration.current;
              event.currentTarget.pause();
              return;
            }
            if (controls && !desiredPlay.current) { desiredPlay.current = true; setManualPause(false); setManualPlay(true); }
          }}
          onError={() => { setFailed(true); setPlaying(false); }}
        />
      )}
      {showToggle && (
        <button type="button" className="media__play-toggle" aria-label={`${playing ? "Pause" : "Play"} ${media.alt || "video"}`}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); togglePlayback(); }}>
          {playing ? "Pause video" : "Play video"}
        </button>
      )}
      {error && (
        <div className="media__error" role="status">
          <span>{isVideo ? "Video unavailable." : "Image unavailable."}</span>
          {localSource && active && !suspended && !insideLink && !inactiveAncestor && !onClick && <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); retry(); }}>Try again</button>}
        </div>
      )}
    </div>
  );
}

export function Media(props: MediaProps) {
  return <MediaAsset key={props.media.assetKey} {...props} />;
}

export default Media;
