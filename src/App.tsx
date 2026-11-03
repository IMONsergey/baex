import { Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Link, Route, Routes, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Reel } from "./components/Reel";
import { MediaPlaybackProvider } from "./components/MediaPlayback";
import { HomePage } from "./pages/HomePage";
import { content } from "./data";
import brand from "./data/brand-map.json";

const WorkPage = lazy(() => import("./pages/WorkPage"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const positions = new Map<string, number>();

// This effect commits only once the lazy route and its layout are mounted.
// Restoring from a timer on App could otherwise clamp the position to a short
// Suspense fallback and then leave the loaded page at the wrong scroll offset.
function RouteReady({ onReady }: { onReady: () => (() => void) }) {
  useLayoutEffect(onReady, [onReady]);
  return null;
}

class PageBoundary extends Component<{children:ReactNode; onReady:() => (() => void)},{failed:boolean}> {
  state = { failed:false };
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error,info:ErrorInfo){console.error("Page rendering failed",error.message,info.componentStack);}
  render(){return this.state.failed ? <><section className="page-error"><h1>Something stopped.</h1><p>Please reload this page to try again.</p><a href={window.location.href} data-native-navigation>Reload page</a></section><RouteReady onReady={this.props.onReady} /></> : this.props.children;}
}

function NotFound(){return <section className="page-error" data-theme="dark"><h1>Page not found.</h1><Link to="/work">Explore the work ↗</Link></section>;}

export default function App(){
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const curtain = useRef<HTMLDivElement>(null);
  const transitioning = useRef(false);
  const transitionVersion = useRef(0);
  const activeEntry = useRef(location.key);
  const restoring = useRef(true);
  const [reelOpen,setReelOpen] = useState(false);
  const [reelOpener,setReelOpener] = useState<HTMLButtonElement | null>(null);
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const projectRoute = pathname.startsWith("/work/");

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const remember = () => {
      if (restoring.current) return;
      positions.set(activeEntry.current, window.scrollY);
      if (positions.size > 100) positions.delete(positions.keys().next().value!);
    };
    // popstate also records the page being left when no link was clicked.
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("popstate", remember);
    window.addEventListener("pagehide", remember);
    return () => {
      window.removeEventListener("scroll", remember);
      window.removeEventListener("popstate", remember);
      window.removeEventListener("pagehide", remember);
      history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(()=>{
    const handle=(event:MouseEvent)=>{
      if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor=(event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if(!anchor || anchor.target || anchor.hasAttribute("download") || anchor.hasAttribute("data-native-navigation")) return;
      const target=new URL(anchor.href,window.location.href);
      if(target.origin!==window.location.origin || !["http:","https:"].includes(target.protocol)) return;
      const to=target.pathname+target.search+target.hash;
      if(to===location.pathname+location.search+location.hash) return;
      event.preventDefault();
      if(transitioning.current) return;
      positions.set(location.key,window.scrollY);
      const version = ++transitionVersion.current;
      const visit = () => {
        if (version !== transitionVersion.current) return;
        positions.set(location.key, window.scrollY);
        restoring.current = true;
        navigate(to);
      };
      if((target.pathname === location.pathname && target.search === location.search) || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !curtain.current){visit();return;}
      transitioning.current=true;
      gsap.killTweensOf(curtain.current);
      gsap.set(curtain.current,{y:0,yPercent:100,pointerEvents:"auto"});
      gsap.to(curtain.current,{yPercent:0,duration:.55,ease:"power4.inOut",onComplete:visit});
    };
    document.addEventListener("click",handle,true);
    return()=>document.removeEventListener("click",handle,true);
  },[location.key,location.pathname,location.search,location.hash,navigate]);

  useLayoutEffect(()=>{
    // A browser Back/Forward action supersedes an unfinished entrance tween.
    // Cancel its delayed navigate() even while the destination is still lazy.
    ++transitionVersion.current;
    if (curtain.current) gsap.killTweensOf(curtain.current);
    const route=content.routes.find(item=>item.path===pathname);
    document.title=(route?.title || "Page not found")+" / REJOUICE reference";
    setReelOpen(false);
  },[location.key,pathname]);

  const restoreRoute = useCallback(() => {
    activeEntry.current = location.key;
    restoring.current = true;
    const saved = navigationType === "POP" ? positions.get(location.key) : undefined;
    const target = saved ?? 0;
    let frame = 0;
    let cancelled = false;
    const restore = () => {
      window.scrollTo({ top: target, left: 0, behavior: "instant" });
      // A saved history position takes precedence over the original anchor.
      if (saved === undefined && location.hash) {
        let id = location.hash.slice(1);
        try { id = decodeURIComponent(id); } catch { /* literal malformed hash */ }
        document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
      }
      ScrollTrigger.update();
    };
    restore();
    frame = requestAnimationFrame(() => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      restore();
      frame = requestAnimationFrame(() => {
        if (cancelled) return;
        restore();
        restoring.current = false;
        positions.set(location.key, window.scrollY);
      });
      if(curtain.current && transitioning.current){
        gsap.killTweensOf(curtain.current);
        gsap.to(curtain.current,{y:0,yPercent:-100,duration:.7,ease:"power4.inOut",onComplete:()=>{
          transitioning.current=false;
          if(curtain.current)gsap.set(curtain.current,{pointerEvents:"none"});
        }});
      }
    });
    return () => { cancelled = true; restoring.current = true; cancelAnimationFrame(frame); };
  }, [location.key, location.hash, navigationType]);

  return <>
    <MediaPlaybackProvider suspended={reelOpen}>
    <a className="skip-link" href="#main-content" data-native-navigation onClick={event => {
      event.preventDefault();
      document.getElementById("main-content")?.focus();
    }}>Skip to content</a>
    <Header />
    <main id="main-content" tabIndex={-1} className="page-frame">
      <PageBoundary key={location.pathname} onReady={restoreRoute}>
        <Suspense fallback={<div className="route-loading" role="status" aria-label="Loading page"><span /></div>}>
          <Routes>
            <Route path="/" element={<HomePage onOpenReel={opener=>{setReelOpener(opener);setReelOpen(true);}} />} />
            <Route path="/work" element={<WorkPage />} />
            <Route path="/work/:slug" element={<ProjectPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <RouteReady onReady={restoreRoute} />
        </Suspense>
      </PageBoundary>
    </main>
    {!projectRoute && <Footer />}
    </MediaPlaybackProvider>
    <Reel open={reelOpen} returnFocusTo={reelOpener} onClose={()=>setReelOpen(false)} />
    <div ref={curtain} className="route-curtain" aria-hidden="true"><img src={brand.headerLogo} alt="" /></div>
  </>;
}
