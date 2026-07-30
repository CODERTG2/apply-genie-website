import { SignInButton } from "@clerk/nextjs";
import { Show } from "@clerk/nextjs";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

// Count scholarships from the JSON for the stats section
import scholarships from "../../current_scholarships.json";

export default function LandingPage() {
  const scholarshipCount = scholarships.length;

  return (
    <div className={styles.landing}>
      <Header />

      {/* ─── Hero ─── */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>
            ✦ Free scholarship matching for students
          </span>
          <h1 className={styles.heroTitle}>
            Find scholarships you
            <br />
            <span className={styles.heroTitleAccent}>actually qualify for</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Answer a few questions about yourself and we&apos;ll match you with
            scholarships from our database of {scholarshipCount.toLocaleString()}+ opportunities.
            No guesswork, no endless scrolling.
          </p>
          <div className={styles.heroCta}>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn--primary btn--large" id="hero-get-started-btn">
                  Start Matching — It&apos;s Free
                </button>
              </SignInButton>
              <a href="#how-it-works" className="btn btn--secondary btn--large">
                See How It Works
              </a>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="btn btn--primary btn--large" id="hero-dashboard-btn">
                Go to Dashboard
              </Link>
            </Show>
          </div>

          <div className={styles.heroStat}>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatNumber}>{scholarshipCount.toLocaleString()}+</span>
              <span className={styles.heroStatLabel}>Scholarships</span>
            </div>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatNumber}>32</span>
              <span className={styles.heroStatLabel}>Matching Criteria</span>
            </div>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatNumber}>~3 min</span>
              <span className={styles.heroStatLabel}>To Complete</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>How It Works</p>
          <h2 className={styles.sectionTitle}>Three steps to your matches</h2>
          <p className={styles.sectionSubtitle}>
            No essays, no long forms. Just honest answers about who you are.
          </p>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>📝</div>
            <p className={styles.stepNumber}>Step 1</p>
            <h3 className={styles.stepTitle}>Answer questions</h3>
            <p className={styles.stepDescription}>
              Tell us about your background, education, and goals. We ask about
              things like your major, GPA, location, and demographics — only what
              matters for scholarship eligibility.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepIcon}>⚡</div>
            <p className={styles.stepNumber}>Step 2</p>
            <h3 className={styles.stepTitle}>We match instantly</h3>
            <p className={styles.stepDescription}>
              Our system compares your profile against every scholarship&apos;s
              eligibility criteria. You only see scholarships you&apos;re actually
              qualified for.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepIcon}>🎯</div>
            <p className={styles.stepNumber}>Step 3</p>
            <h3 className={styles.stepTitle}>Apply with confidence</h3>
            <p className={styles.stepDescription}>
              Browse your personalized results, save the ones you like, and click
              through to apply. No more wondering if you qualify.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Stats Banner ─── */}
      <section className={styles.statsBanner}>
        <div className={styles.statsGrid}>
          <div>
            <p className={styles.statValue}>{scholarshipCount.toLocaleString()}+</p>
            <p className={styles.statDescription}>Scholarships in our database</p>
          </div>
          <div>
            <p className={styles.statValue}>30+</p>
            <p className={styles.statDescription}>Profile attributes matched</p>
          </div>
          <div>
            <p className={styles.statValue}>Free</p>
            <p className={styles.statDescription}>Always, no hidden fees</p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className={styles.faq} id="faq">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionEyebrow}>FAQ</p>
          <h2 className={styles.sectionTitle}>Common questions</h2>
        </div>

        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>Is this really free?</h3>
            <p className={styles.faqAnswer}>
              Yes, completely free. We built this to help students find money for
              school, not to make money off them.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>How does matching work?</h3>
            <p className={styles.faqAnswer}>
              Each scholarship has specific eligibility criteria (age, major, GPA,
              location, etc.). We compare your profile against these criteria and
              show you only the ones that fit.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>What data do you collect?</h3>
            <p className={styles.faqAnswer}>
              Only what you provide in the questionnaire — things like your
              education level, major, and demographics. We don&apos;t sell your data
              or share it with third parties.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>Can I update my profile later?</h3>
            <p className={styles.faqAnswer}>
              Absolutely. Your profile is saved and you can update any answer at
              any time. Your matches will update automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to find your scholarships?</h2>
          <p className={styles.ctaSubtitle}>
            It takes about 3 minutes. No credit card, no catch.
          </p>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="btn btn--primary btn--large" id="cta-sign-up-btn">
                Create Your Free Account
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link href="/questionnaire" className="btn btn--primary btn--large">
              Complete Your Profile
            </Link>
          </Show>
        </div>
      </section>

      <Footer />
    </div>
  );
}
