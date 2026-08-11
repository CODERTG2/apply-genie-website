import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./about.module.css";

export default function AboutPage() {
  // Add tester names here
  const testers = [
    "Tester Name 1",
    "Tester Name 2",
    "Tester Name 3",
  ];

  return (
    <div className={styles.aboutPage}>
      <Header />
      
      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Our Mission</span>
            <h1 className={styles.heroTitle}>
              About <span className={styles.heroTitleAccent}>Scholarship HQ</span>
            </h1>
            <p className={styles.heroSubtitle}>
              We believe every student deserves a fair chance at education. Scholarship HQ was built to bridge the gap between students and the scholarships they qualify for.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>The Project</h2>
          <p className={styles.sectionText}>
            Finding scholarships shouldn&apos;t be a full-time job. We created Scholarship HQ to eliminate the endless scrolling and guesswork. By answering a few simple questions, our intelligent matching engine instantly compares your profile against our curated database of opportunities.
          </p>
          <p className={styles.sectionText}>
            Our goal is to make higher education more accessible by streamlining the financial aid discovery process, ensuring you only see the scholarships you are actually qualified for.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Thank You to Our Testers</h2>
          <p className={styles.sectionText} style={{ textAlign: "center" }}>
            This project wouldn&apos;t be where it is today without the invaluable feedback from our early testers. Thank you for helping us refine Scholarship HQ!
          </p>
          
          <div className={styles.testersList}>
            {testers.map((tester, index) => (
              <div key={index} className={styles.testerCard}>
                {tester}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
