import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="site-footer">
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          Scholarship<span className={styles.footerAccent}>HQ</span>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/" className={styles.footerLink}>
            Home
          </Link>
          <Link href="/about" className={styles.footerLink}>
            About
          </Link>
          <a href="/#how-it-works" className={styles.footerLink}>
            How It Works
          </a>
          <a href="/#faq" className={styles.footerLink}>
            FAQ
          </a>
          <a href="https://forms.gle/4mE5bVKiRBvF2Z8p7" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            Report an issue
          </a>
          <a href="https://forms.gle/RyP4sX3gsgySw8ji8" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            Request a feature
          </a>
        </div>
        <p className={styles.footerCopy}>
          © {new Date().getFullYear()} Scholarship HQ. Built to help students find scholarships.
        </p>
      </div>
    </footer>
  );
}
