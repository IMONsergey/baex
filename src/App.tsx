import { Component, Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Link, Route, Routes, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Reel } from "./components/Reel";
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

class PageBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state = { failed:false };
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error,info:ErrorInfo){console.error("Page rendering failed",error.message,info.componentStack);}
  render(){return this.state.failed ? <section className="page-error"><h1>Something stopped.</h1><p>Please reload this page to try again.</p><a href={window.location.pathname}>Reload page</a></section> : this.props.children;}
}

function NotFound(){return <section className="page-error" data-theme="dark"><h1>Page not found.</h1><Link to="/work">Explore the work ↗</Link></section>;}

export default function App(){
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const curtain = useRef<HTMLDivElement>(null);
  const transitioning = useRef(false);
  const [reelOpen,setReelOpen] = useState(false);
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const projectRoute = pathname.startsWith("/work/");

  useEffect(()=>{
    history.scrollRestoration="manual";
    const handle=(event:MouseEvent)=>{
      if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor=(event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if(!anchor || anchor.target || anchor.hasAttribute("download") || anchor.getAttribute("href")?.startsWith("#")) return;
      const target=new URL(anchor.href,window.location.href);
      if(target.origin!==window.location.origin || !["http:","https:"].includes(target.protocol)) return;
      const to=target.pathname+target.search+target.hash;
      if(to===location.pathname+location.search+location.hash) return;
      event.preventDefault();
      if(transitioning.current) return;
      positions.set(location.pathname,window.scrollY);
      if(window.matchMedia("(prefers-reduced-motion: reduce)").matches || !curtain.current){navigate(to);return;}
      transitioning.current=true;
      gsap.killTweensOf(curtain.current);
      gsap.set(curtain.current,{y:0,yPercent:100,pointerEvents:"auto"});
      gsap.to(curtain.current,{yPercent:0,duration:.55,ease:"power4.inOut",onComplete:()=>navigate(to)});
    };
    document.addEventListener("click",handle,true);
    return()=>document.removeEventListener("click",handle,true);
  },[location.pathname,location.search,location.hash,navigate]);

  useLayoutEffect(()=>{
    const route=content.routes.find(item=>item.path===pathname);
    document.title=(route?.title || "Page not found")+" / REJOUICE reference";
    document.documentElement.style.overflow="";
    document.body.style.overflow="";
    window.scrollTo(0,navigationType==="POP" ? (positions.get(location.pathname) || 0) : 0);
    setReelOpen(false);
    let timer=window.setTimeout(()=>{
      ScrollTrigger.refresh();
      window.scrollTo(0,navigationType==="POP" ? (positions.get(location.pathname) || 0) : 0);
      if(curtain.current && transitioning.current){
        gsap.to(curtain.current,{y:0,yPercent:-100,duration:.7,ease:"power4.inOut",onComplete:()=>{
          transitioning.current=false;
          if(curtain.current)gsap.set(curtain.current,{pointerEvents:"none"});
        }});
      }
      if(location.hash){document.getElementById(location.hash.slice(1))?.scrollIntoView();}
    },80);
    return()=>window.clearTimeout(timer);
  },[location.pathname,location.hash,navigationType]);

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Header />
    <main id="main-content" tabIndex={-1} className="page-frame">
      <PageBoundary key={location.pathname}>
        <Suspense fallback={<div className="route-loading" role="status" aria-label="Loading page"><span /></div>}>
          <Routes>
            <Route path="/" element={<HomePage onOpenReel={()=>setReelOpen(true)} />} />
            <Route path="/work" element={<WorkPage />} />
            <Route path="/work/:slug" element={<ProjectPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PageBoundary>
    </main>
    {!projectRoute && <Footer />}
    <Reel open={reelOpen} onClose={()=>setReelOpen(false)} />
    <div ref={curtain} className="route-curtain" aria-hidden="true"><img src={brand.headerLogo} alt="" /></div>
  </>;
}
