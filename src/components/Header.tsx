import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { content } from "../data";
import brand from "../data/brand-map.json";
import "../styles/shell.css";

export function Header() {
  const location = useLocation();
  const [pastHeroTop, setPastHeroTop] = useState(() => typeof window !== "undefined" && window.scrollY >= 100);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const homeIntro = location.pathname === "/" && !pastHeroTop;

  useEffect(() => {
    const update = () => setPastHeroTop(window.scrollY >= 100);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (desktop.matches) { setMenuOpen(false); setMenuMounted(false); }
    };
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!menuMounted || !element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (menuOpen) {
        gsap.fromTo(element, { yPercent: reduced ? 0 : -100 }, {
          yPercent: 0, duration: reduced ? 0 : 0.75, ease: "power4.inOut",
        });
        gsap.fromTo(".mobile-menu-item > a", { yPercent: reduced ? 0 : 115, opacity: 0 }, {
          yPercent: 0, opacity: 1, duration: reduced ? 0 : 0.8,
          delay: reduced ? 0 : 0.25, stagger: reduced ? 0 : 0.045, ease: "power3.out",
        });
        gsap.fromTo(".mobile-menu-talk, .mobile-menu-socials", { opacity: 0 }, {
          opacity: 1, delay: reduced ? 0 : 0.5, duration: reduced ? 0 : 0.4,
        });
      } else {
        gsap.to(element, {
          yPercent: reduced ? 0 : -100, duration: reduced ? 0 : 0.45,
          ease: "power3.inOut", onComplete: () => setMenuMounted(false),
        });
      }
    }, element);
    return () => context.revert();
  }, [menuOpen, menuMounted]);

  useEffect(() => {
    const element = dialog.current;
    if (!menuMounted || !element) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => closeButton.current?.focus({ preventScroll: true }));

    const focusable = () => Array.from(element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((node) => node.getClientRects().length > 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); return; }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) { event.preventDefault(); element.focus(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !element.contains(event.target)) focusable()[0]?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
      else menuButton.current?.focus({ preventScroll: true });
    };
  }, [menuMounted]);

  const closeMenu = () => setMenuOpen(false);
  const menu = menuMounted ? (
    <div ref={dialog} className="mobile-menu-dialog" role="dialog" aria-modal="true" aria-label="Main menu" tabIndex={-1} id="mobile-navigation">
      <Link to="/" className="mobile-menu-brand" aria-label={`${content.site.name} home`} onClick={closeMenu}>
        {homeIntro ? <span>{content.site.tagline.split("\n")[0]}</span> : <img src={brand.headerLogo} alt="" width="68" height="12" />}
      </Link>
      <button ref={closeButton} type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Close menu">Close</button>
      <div className="mobile-menu-inner">
        <div className="mobile-menu-talk"><Link to="/contact" onClick={closeMenu}>Let&apos;s talk <span aria-hidden="true">↗</span></Link></div>
        <nav className="mobile-menu-navigation" aria-label="Main navigation">
          <ul>{content.site.nav.map((item) => (
            <li className="mobile-menu-item" key={item.path}>
              <NavLink to={item.path} end={item.path === "/"} onClick={closeMenu}>{item.label}</NavLink>
            </li>
          ))}</ul>
        </nav>
        <ul className="mobile-menu-socials">{content.site.socials.map((item) => (
          <li key={item.url}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a></li>
        ))}</ul>
      </div>
    </div>
  ) : null;

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className={`header-brand ${homeIntro ? "is-home-intro" : ""}`} aria-label={`${content.site.name} home`}>
            <span className="header-brand-tagline" aria-hidden="true">
              <span className="header-tagline-mobile">{content.site.tagline.split("\n")[0]}</span>
              <span className="header-tagline-desktop">{content.site.tagline.replace(/\n/g, " ")}</span>
            </span>
            <img className="header-brand-logo" src={brand.headerLogo} width="68" height="12" alt="" />
          </Link>
          <nav className="header-nav" aria-label="Main navigation"><ul>
            {content.site.nav.map((item) => <li key={item.path}><NavLink to={item.path} end={item.path === "/"}>{item.label}</NavLink></li>)}
          </ul></nav>
          <Link to="/contact" className="header-contact">Let&apos;s talk <span aria-hidden="true">↗</span></Link>
          <button className="header-menu-toggle" ref={menuButton} type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation"
            onClick={() => { setMenuMounted(true); setMenuOpen(true); }}>Menu</button>
        </div>
      </header>
      {menu && createPortal(menu, document.body)}
    </>
  );
}

export default Header;
