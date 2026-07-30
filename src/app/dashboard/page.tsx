"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RequirementSwiper from "@/components/RequirementSwiper";
import styles from "./page.module.css";

// All profile fields that matter for completion tracking
const PROFILE_FIELDS = [
  "age", "gender", "race", "ethnicity", "lgbtq",
  "countryOfResidence", "citizenshipStatus",
  "educationType", "enrollmentStatus", "gpa",
  "fieldOfStudy", "financialNeed", "firstGeneration",
  "communityService",
];

export default function DashboardPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [savedScholarships, setSavedScholarships] = useState<
    Array<{ scholarshipTitle: string; savedAt: string }>
  >([]);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/scholarships/save").then((r) => r.json()),
      fetch("/api/scholarships").then((r) => r.json()),
    ])
      .then(([profileData, savedData, matchData]) => {
        setProfile(profileData.profile || null);
        setSavedScholarships(savedData.saved || []);
        setMatchCount(matchData.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Calculate profile completion
  const completedFields = profile
    ? PROFILE_FIELDS.filter((f) => {
        const val = profile[f];
        if (val === null || val === undefined || val === "") return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      }).length
    : 0;
  const completionPercent = Math.round(
    (completedFields / PROFILE_FIELDS.length) * 100
  );

  const firstName = user?.firstName || "there";

  if (loading) {
    return (
      <div className={styles.dashboardPage}>
        <Header />
        <div className={styles.loading}>Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      <Header />
      <div className={styles.inner}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>Welcome back, {firstName}</h1>
          <p className={styles.greetingSubtitle}>
            Here&apos;s an overview of your scholarship journey.
          </p>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <p className={styles.statCardLabel}>Profile Completion</p>
            <p className={styles.statCardValue}>
              <span className={styles.statCardAccent}>{completionPercent}%</span>
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statCardLabel}>Matched Scholarships</p>
            <p className={styles.statCardValue}>{matchCount}</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statCardLabel}>Saved Scholarships</p>
            <p className={styles.statCardValue}>{savedScholarships.length}</p>
          </div>
        </div>

        {/* Profile Completion Card */}
        <div className={styles.completionCard}>
          <div className={styles.completionHeader}>
            <h2 className={styles.completionTitle}>Your Profile</h2>
            <span className={styles.completionPercent}>{completionPercent}%</span>
          </div>
          <div className={styles.completionTrack}>
            <div
              className={styles.completionFill}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className={styles.completionMessage}>
            {completionPercent === 100
              ? "Your profile is complete! Your matches are as accurate as possible."
              : `${completedFields} of ${PROFILE_FIELDS.length} key fields filled. Complete your profile for better matches.`}
          </p>
          {completionPercent < 100 && (
            <Link
              href="/questionnaire"
              className="btn btn--primary"
              style={{ marginTop: "var(--space-4)" }}
            >
              {completedFields === 0 ? "Start Your Profile" : "Continue Profile"}
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-10)" }}>
          <Link href="/scholarships" className="btn btn--primary btn--large">
            View {matchCount} Matched Scholarships
          </Link>
          <Link href="/profile" className="btn btn--ghost btn--large">
            Edit Profile
          </Link>
        </div>

        {/* Specific Requirements Swiper */}
        <div className={styles.savedSection} style={{ marginBottom: "var(--space-10)" }}>
          <h2 className={styles.savedTitle}>Refine Your Matches</h2>
          <p className={styles.greetingSubtitle} style={{ marginBottom: "var(--space-6)" }}>
            Swipe right if you meet the specific requirement, or left if you don't, to improve your match accuracy.
          </p>
          <RequirementSwiper />
        </div>

        {/* Saved Scholarships */}
        <div className={styles.savedSection}>
          <h2 className={styles.savedTitle}>Saved Scholarships</h2>
          {savedScholarships.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No saved scholarships yet. Browse your matches and bookmark the ones you like.</p>
              <Link
                href="/scholarships"
                className="btn btn--ghost"
                style={{ marginTop: "var(--space-4)" }}
              >
                Browse Scholarships
              </Link>
            </div>
          ) : (
            <div className={styles.savedList}>
              {savedScholarships.map((s) => (
                <div key={s.scholarshipTitle} className={styles.savedItem}>
                  <span className={styles.savedItemTitle}>{s.scholarshipTitle}</span>
                  <span className={styles.savedItemDate}>
                    Saved {new Date(s.savedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
