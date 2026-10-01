import { SignInButton, Show } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";
import { db } from "@/db";
import { scholarships as scholarshipsTable } from "@/db/schema";
import { count } from "drizzle-orm";

const steps = [
  { title: "Answer questions", description: "Tell us about your background, education, and goals. We ask about your major, GPA, location, and demographics: only what matters for scholarship eligibility." },
  { title: "We match instantly", description: "Our system compares your profile against every scholarship’s eligibility criteria, so you can focus on opportunities that fit." },
  { title: "Apply with confidence", description: "Browse your personalized results, save the ones you like, and click through to apply. Your next opportunity starts here." },
];

const questions = [
  { question: "Is this really free?", answer: "Yes, completely free. We built this to help students find money for school, not to make money off them." },
  { question: "How does matching work?", answer: "Each scholarship has specific eligibility criteria (age, major, GPA, location, etc.). We compare your profile against these criteria and show you the ones that fit." },
  { question: "What data do you collect?", answer: "Only what you provide in the questionnaire — things like your education level, major, and demographics. We don’t sell your data or share it with third parties." },
  { question: "Can I update my profile later?", answer: "Absolutely. Your profile is saved and you can update any answer at any time. Your matches will update automatically." },
];

export default async function LandingPage() {
  const result = await db.select({ value: count() }).from(scholarshipsTable);
  const scholarshipCount = result[0].value;

  return (
    <div className={styles.landing}>
      <Header />
      <main id="main-content">
        <section className={styles.hero} id="hero" aria-labelledby="hero-title">
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}><Check size={16} aria-hidden="true" /> Free scholarship matching for students</p>
            <h1 className={styles.heroTitle} id="hero-title">Find scholarships you <span className={styles.heroTitleAccent}>actually qualify for.</span></h1>
            <p className={styles.heroSubtitle}>Answer a few questions. Discover scholarships that fit you. Spend less time searching and more time moving forward.</p>
            <div className={styles.heroCta}>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="btn btn--primary btn--large" id="hero-get-started-btn">Start Matching <ArrowRight size={18} aria-hidden="true" /></button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className="btn btn--primary btn--large" id="hero-dashboard-btn">Go to Dashboard <ArrowRight size={18} aria-hidden="true" /></Link>
              </Show>
              <a href="#how-it-works" className={styles.textLink}>See How It Works <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <div className={styles.heroImage}>
            <Image src="/students-library.webp" alt="Illustration of two students exploring opportunities together in a college library" width={1000} height={1000} sizes="(max-width: 767px) 100vw, 45vw" priority />
          </div>
        </section>

        <section className={styles.statsBanner} aria-label="Scholarship matching at a glance">
          <dl className={styles.statsGrid}>
            <div><dt>Scholarships to explore</dt><dd>{scholarshipCount.toLocaleString()}<span>+</span></dd></div>
            <div><dt>To complete your profile</dt><dd>~3 <span>min</span></dd></div>
            <div><dt>No hidden fees</dt><dd>Always free</dd></div>
          </dl>
        </section>

        <section className={styles.howItWorks} id="how-it-works" aria-labelledby="steps-title">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id="steps-title">Three steps to your matches</h2>
            <p className={styles.sectionSubtitle}>No essays, no long forms. Just honest answers about who you are.</p>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li className={styles.step} key={step.title}>
                <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
                <div><h3 className={styles.stepTitle}>{step.title}</h3><p className={styles.stepDescription}>{step.description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.faq} id="faq" aria-labelledby="faq-title">
          <div className={styles.faqIntro}>
            <p className={styles.sectionEyebrow}>FAQ</p>
            <h2 className={styles.sectionTitle} id="faq-title">Common questions.<br />Clear answers.</h2>
            <p className={styles.sectionSubtitle}>A little more about finding your fit.</p>
          </div>
          <div className={styles.faqList}>
            {questions.map(({ question, answer }) => (
              <details className={styles.faqItem} key={question}>
                <summary className={styles.faqQuestion}>{question}<Plus size={20} aria-hidden="true" /></summary>
                <p className={styles.faqAnswer}>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.ctaBanner} aria-labelledby="cta-title">
          <div><h2 className={styles.ctaTitle} id="cta-title">Your next opportunity is out there.</h2><p className={styles.ctaSubtitle}>Find your scholarships in about 3 minutes. No credit card, no catch.</p></div>
          <Show when="signed-out"><SignInButton mode="modal"><button className="btn btn--primary btn--large" id="cta-sign-up-btn">Create Your Free Account <ArrowRight size={18} aria-hidden="true" /></button></SignInButton></Show>
          <Show when="signed-in"><Link href="/questionnaire" className="btn btn--primary btn--large">Complete Your Profile <ArrowRight size={18} aria-hidden="true" /></Link></Show>
        </section>
      </main>
      <Footer />
    </div>
  );
}
