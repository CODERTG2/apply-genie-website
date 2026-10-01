"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./Header.module.css";

export default function Header() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const links = isSignedIn
    ? [{ href: "/dashboard", label: "Dashboard" }, { href: "/profile", label: "Profile" }, { href: "/scholarships", label: "Scholarships" }]
    : [{ href: "/about", label: "About" }, { href: "/#how-it-works", label: "How It Works" }, { href: "/#faq", label: "FAQ" }];

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButtonRef.current?.focus(); }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    // Close the mobile disclosure when moving back to desktop.
    const media = window.matchMedia("(min-width: 768px)");
    const onResize = () => { if (media.matches) setMenuOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    media.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      media.removeEventListener("change", onResize);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className={styles.header} id="site-header" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
    }}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo} id="logo-link" onClick={() => setMenuOpen(false)}>
          <span className={styles.logoIcon} aria-hidden="true">✦</span>
          <span className={styles.logoText}>Scholarship<span className={styles.logoAccent}>HQ</span></span>
        </Link>
        <div className={styles.navActions}>
          <ThemeToggle />
          <div className={styles.accountAction}>
            {!isLoaded ? <span className={styles.authPlaceholder} aria-label="Loading account" /> : isSignedIn ? (
              <UserButton appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }} />
            ) : (
              <SignInButton mode="modal"><button className={`btn btn--primary ${styles.desktopSignIn}`} id="header-sign-in-btn">Get Started</button></SignInButton>
            )}
          </div>
          <button ref={menuButtonRef} className={styles.menuButton} type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} id="main-nav" aria-label="Main navigation">
          {links.map(({ href, label }) => (
            <Link href={href} className={styles.navLink} key={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          {isLoaded && !isSignedIn && <div className={styles.mobileSignIn}><SignInButton mode="modal"><button className="btn btn--primary" onClick={() => setMenuOpen(false)}>Get Started</button></SignInButton></div>}
        </nav>
      </div>
    </header>
  );
}
