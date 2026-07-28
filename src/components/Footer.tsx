import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="site-footer">
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          Apply<span className={styles.footerAccent}>Genie</span>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/" className={styles.footerLink}>
            Home
          </Link>
          <a href="#how-it-works" className={styles.footerLink}>
            How It Works
          </a>
          <a href="#faq" className={styles.footerLink}>
            FAQ
          </a>
        </div>
        <p className={styles.footerCopy}>
          © {new Date().getFullYear()} ApplyGenie. Built to help students find scholarships.
        </p>
      </div>
    </footer>
  );
}
