"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./page.module.css";

type Scholarship = {
  title: string;
  organization: string;
  funds: string;
  deadline: string;
  link: string;
  purpose: string;
  matchedFields: number;
  totalFields: number;
  matchScore: number;
};

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"match" | "deadline" | "amount">("match");
  const [total, setTotal] = useState(0);

  // Load scholarships and saved list
  useEffect(() => {
    Promise.all([
      fetch("/api/scholarships").then((r) => r.json()),
      fetch("/api/scholarships/save").then((r) => r.json()),
    ])
      .then(([matchData, savedData]) => {
        setScholarships(matchData.scholarships || []);
        setTotal(matchData.total || 0);
        const saved = new Set<string>(
          (savedData.saved || []).map((s: { scholarshipTitle: string }) => s.scholarshipTitle)
        );
        setSavedTitles(saved);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleBookmark = async (title: string) => {
    const isSaved = savedTitles.has(title);

    if (isSaved) {
      setSavedTitles((prev) => {
        const next = new Set(prev);
        next.delete(title);
        return next;
      });
      await fetch("/api/scholarships/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    } else {
      setSavedTitles((prev) => new Set(prev).add(title));
      await fetch("/api/scholarships/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    }
  };

  // Sort
  const sorted = [...scholarships].sort((a, b) => {
    if (sortBy === "match") return b.matchScore - a.matchScore;
    if (sortBy === "amount") {
      const extractAmount = (s: string) => {
        const match = s.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, ""), 10) : 0;
      };
      return extractAmount(b.funds) - extractAmount(a.funds);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className={styles.scholarshipsPage}>
        <Header />
        <div className={styles.loading}>Finding your matches...</div>
      </div>
    );
  }

  return (
    <div className={styles.scholarshipsPage}>
      <Header />
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Your Scholarships</h1>
          <p className={styles.pageSubtitle}>
            <span className={styles.matchCount}>{total}</span> scholarships match your profile
          </p>
        </div>

        {scholarships.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2 className={styles.emptyTitle}>No matches yet</h2>
            <p className={styles.emptyText}>
              Complete your profile to start seeing scholarship matches.
            </p>
            <Link href="/questionnaire" className="btn btn--primary btn--large">
              Complete Your Profile
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.filters}>
              <select
                className={styles.filterSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "match" | "deadline" | "amount")}
                id="sort-select"
              >
                <option value="match">Sort by Match</option>
                <option value="amount">Sort by Amount</option>
                <option value="deadline">Sort by Deadline</option>
              </select>
            </div>

            <div className={styles.grid}>
              {sorted.map((s) => (
                <div key={s.title} className={styles.scholarshipCard}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{s.title}</h3>
                    <button
                      className={styles.bookmarkBtn}
                      onClick={() => toggleBookmark(s.title)}
                      title={savedTitles.has(s.title) ? "Remove bookmark" : "Save scholarship"}
                      id={`bookmark-${s.title.slice(0, 20).replace(/\s/g, "-")}`}
                    >
                      {savedTitles.has(s.title) ? "★" : "☆"}
                    </button>
                  </div>

                  <p className={styles.cardOrg}>{s.organization}</p>

                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Award</span>
                      <span className={styles.metaValue}>{s.funds}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Deadline</span>
                      <span className={styles.metaValue}>{s.deadline}</span>
                    </div>
                  </div>

                  {s.purpose && (
                    <p className={styles.cardPurpose}>
                      {s.purpose}
                      {s.purpose.length >= 200 ? "..." : ""}
                    </p>
                  )}

                  <div className={styles.cardFooter}>
                    <span
                      className={`${styles.matchBadge} ${
                        s.matchScore >= 80 ? styles.matchHigh : styles.matchMedium
                      }`}
                    >
                      {s.matchScore}% match
                    </span>
                    {s.link && (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.applyLink}
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
