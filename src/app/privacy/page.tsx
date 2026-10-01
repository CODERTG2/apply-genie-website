import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "../legal.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Scholarship HQ",
  description: "How we collect, use, and protect your data at Scholarship HQ.",
};

export default function PrivacyPolicy() {
  return (
    <div className={styles.page}>
      <Header />
      
      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Legal</span>
            <h1 className={styles.heroTitle}>Privacy Policy</h1>
            <p className={styles.heroSubtitle}>
              Last updated: September 30, 2026
            </p>
          </div>
        </section>

        <section className={styles.content}>
          <h2>1. Introduction</h2>
          <p>
            Welcome to Scholarship HQ. We are committed to protecting your personal information and your right to privacy. 
            Because our service relies on matching you with scholarships based on your unique background, we collect personal and demographic data. We believe in being transparent about how we protect this data.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect information you provide directly to us when you register for an account and fill out our questionnaire:</p>
          <ul>
            <li><strong>Account Information:</strong> Your name and email address, handled securely by our authentication provider.</li>
            <li><strong>Demographic & Academic Data:</strong> Information such as age, gender, race, GPA, location, and other profile criteria used strictly to match you with relevant scholarships.</li>
          </ul>

          <h2>3. How We Secure Your Data</h2>
          <p>
            We take your privacy seriously. All personally identifiable information (PII) and demographic data you enter into our questionnaire is <strong>encrypted at rest</strong> in our database. This means that even if our database were ever compromised, your sensitive information would remain unreadable without the specific decryption keys.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>We do not sell your personal data. We only share necessary data with trusted third-party service providers to operate our platform:</p>
          <ul>
            <li><strong>Clerk:</strong> Used for secure user authentication and account management.</li>
            <li><strong>Resend:</strong> Used for sending transactional emails (such as account updates or matching notifications).</li>
            <li><strong>Turso & Vercel:</strong> Used for secure database storage and website hosting.</li>
          </ul>

          <h2>5. Your Rights & Account Deletion</h2>
          <p>
            You have full control over your data. You can access, update, or delete your profile information at any time through your account dashboard. 
            If you wish to permanently delete your account and all associated encrypted data, you can do so in your account settings, and it will be immediately wiped from our servers.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you may email us or use our issue reporting form.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
