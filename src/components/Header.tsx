"use client";

import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./Header.module.css";

export default function Header() {
  const { isSignedIn } = useAuth();

  return (
    <header className={styles.header} id="site-header">
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo} id="logo-link">
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>
            Apply<span className={styles.logoAccent}>Genie</span>
          </span>
        </Link>

        <nav className={styles.nav} id="main-nav">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
              <Link href="/questionnaire" className={styles.navLink}>
                Profile
              </Link>
              <Link href="/scholarships" className={styles.navLink}>
                Scholarships
              </Link>
            </>
          ) : (
            <>
              <a href="#how-it-works" className={styles.navLink}>
                How It Works
              </a>
              <a href="#faq" className={styles.navLink}>
                FAQ
              </a>
            </>
          )}
        </nav>

        <div className={styles.navActions}>
          <ThemeToggle />
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: 36, height: 36 },
                },
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <button className="btn btn--primary" id="header-sign-in-btn">
                Get Started
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
