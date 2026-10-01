import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "../legal.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Scholarship HQ",
  description: "Terms and conditions for using Scholarship HQ.",
};

export default function TermsOfService() {
  return (
    <div className={styles.page}>
      <Header />
      
      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Legal</span>
            <h1 className={styles.heroTitle}>Terms of Service</h1>
            <p className={styles.heroSubtitle}>
              Last updated: September 30, 2026
            </p>
          </div>
        </section>

        <section className={styles.content}>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using Scholarship HQ, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2>2. Age Requirements</h2>
          <p>
            You must be at least 13 years old to use Scholarship HQ. By using our platform, you represent and warrant that you meet this age requirement.
          </p>

          <h2>3. No Guarantee of Scholarships</h2>
          <p>
            Scholarship HQ is a discovery engine that matches you with potential scholarship opportunities based on the information you provide. 
            <strong> We do not guarantee that you will be eligible for, or that you will win, any scholarship featured on our platform.</strong> 
            The final decision regarding eligibility and awards rests entirely with the third-party scholarship providers.
          </p>

          <h2>4. Third-Party Links & Providers</h2>
          <p>
            Our service contains links to external websites and scholarship applications that are not owned or controlled by Scholarship HQ. 
            We have no control over, and assume no responsibility for, the content, privacy policies, application deadlines, or practices of any third-party websites or services. 
            You acknowledge and agree that Scholarship HQ shall not be responsible or liable, directly or indirectly, for any damage or loss caused by your use of any such content, goods, or services available on or through any such websites.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>
            You agree not to use the platform in any way that violates any applicable local, state, national, or international law or regulation. 
            Automated scraping of our scholarship database, attempting to bypass our security measures, or providing intentionally false information to manipulate our matching system is strictly prohibited.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall Scholarship HQ, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
          
          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
