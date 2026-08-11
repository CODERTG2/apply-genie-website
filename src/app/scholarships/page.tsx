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
  parsedDeadline?: { display: string; date: Date | null };
  criteriaCount: number;
  submissionRequirementsCount: number;
};

function formatDeadline(deadlineStr: string): { display: string, date: Date | null } {
  if (!deadlineStr) return { display: "N/A", date: null };
  const match = deadlineStr.match(/([a-zA-Z]+\s+\d{1,2},\s+\d{4})/);
  if (match) {
    const d = new Date(match[1]);
    if (!isNaN(d.getTime())) {
      return {
        display: match[1],
        date: d
      };
    }
  }
  return { display: "N/A", date: null };
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"match" | "deadline" | "amount">("match");
  const [total, setTotal] = useState(0);
  const [hasUnansweredReqs, setHasUnansweredReqs] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [deadlineBefore, setDeadlineBefore] = useState<string>("");
  const [filterSubmissionReqs, setFilterSubmissionReqs] = useState<string>("any");
  const [minAmount, setMinAmount] = useState<number>(0);

  // Load scholarships and saved list
  useEffect(() => {
    Promise.all([
      fetch("/api/scholarships").then((r) => r.json()),
      fetch("/api/scholarships/save").then((r) => r.json()),
    ])
      .then(([matchData, savedData]) => {
        setScholarships(
          (matchData.scholarships || []).map((s: Scholarship) => ({
            ...s,
            parsedDeadline: formatDeadline(s.deadline)
          }))
        );
        setTotal(matchData.total || 0);
        setHasUnansweredReqs(matchData.hasUnansweredReqs || false);
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

  // Filter
  const filtered = scholarships.filter((s) => {
    // Match Score
    if (s.matchScore < minMatchScore) return false;

    // Requirements
    if (filterSubmissionReqs !== "any") {
      const count = s.submissionRequirementsCount;
      if (filterSubmissionReqs === "0" && count !== 0) return false;
      if (filterSubmissionReqs === "1-2" && (count < 1 || count > 2)) return false;
      if (filterSubmissionReqs === "3-5" && (count < 3 || count > 5)) return false;
      if (filterSubmissionReqs === "5+" && count <= 5) return false;
    }

    // Amount
    const extractAmount = (str: string) => {
      const match = str.match(/[\d,]+/);
      return match ? parseInt(match[0].replace(/,/g, ""), 10) : 0;
    };
    if (extractAmount(s.funds) < minAmount) return false;

    // Deadline
    if (deadlineBefore) {
      if (!s.parsedDeadline?.date) return false;
      const selectedDate = new Date(deadlineBefore);
      // set to end of day
      selectedDate.setHours(23, 59, 59, 999);
      if (s.parsedDeadline.date > selectedDate) return false;
    }

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "match") return b.matchScore - a.matchScore;
    if (sortBy === "amount") {
      const extractAmount = (s: string) => {
        const match = s.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, ""), 10) : 0;
      };
      return extractAmount(b.funds) - extractAmount(a.funds);
    }
    if (sortBy === "deadline") {
      const dateA = a.parsedDeadline?.date;
      const dateB = b.parsedDeadline?.date;
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const getPriority = (d?: Date | null) => {
        if (!d) return 2; // N/A
        if (d.getTime() < now.getTime()) return 1; // Past
        return 0; // Upcoming
      };

      const prioA = getPriority(dateA);
      const prioB = getPriority(dateB);

      if (prioA !== prioB) {
        return prioA - prioB;
      }

      if (dateA && dateB) {
        return dateA.getTime() - dateB.getTime();
      }
      
      return 0;
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

        {hasUnansweredReqs && (
          <div style={{
            backgroundColor: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.5)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            marginBottom: "var(--space-6)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.875rem"
          }}>
            <div>
              <strong style={{ color: "var(--color-primary)", display: "block", marginBottom: "4px" }}>Improve your match scores!</strong>
              You have some specific scholarship requirements you haven't answered yet.
            </div>
            <Link href="/dashboard" className="btn btn--primary" style={{ padding: "8px 16px" }}>
              Answer Now
            </Link>
          </div>
        )}

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
            <div className={styles.contentLayout}>
              <aside className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>Filters</h3>
                
                <div className={styles.filterSection}>
                  <div className={styles.filterHeader}>
                    <h4 className={styles.filterTitle}>Sort By</h4>
                  </div>
                  <select
                    className={styles.dateInput}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "match" | "deadline" | "amount")}
                  >
                    <option value="match">Match Score</option>
                    <option value="amount">Award Amount</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>

                <div className={styles.filterSection}>
                  <div className={styles.filterHeader}>
                    <h4 className={styles.filterTitle}>Match Score</h4>
                    <span className={styles.filterValue}>{minMatchScore}%+</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className={styles.rangeSlider} 
                    value={minMatchScore} 
                    onChange={(e) => setMinMatchScore(Number(e.target.value))} 
                  />
                </div>

                <div className={styles.filterSection}>
                  <div className={styles.filterHeader}>
                    <h4 className={styles.filterTitle}>Deadline Before</h4>
                  </div>
                  <div className={styles.datePickerWrapper}>
                    <input 
                      type="date" 
                      className={styles.dateInput} 
                      value={deadlineBefore} 
                      onChange={(e) => setDeadlineBefore(e.target.value)} 
                    />
                    {deadlineBefore && (
                      <button className={styles.clearDateBtn} onClick={() => setDeadlineBefore("")}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <div className={styles.filterHeader}>
                    <h4 className={styles.filterTitle}>Effort Level</h4>
                  </div>
                  <select
                    className={styles.dateInput}
                    value={filterSubmissionReqs}
                    onChange={(e) => setFilterSubmissionReqs(e.target.value)}
                  >
                    <option value="any">Any Effort Level</option>
                    <option value="0">No Essay (0 reqs)</option>
                    <option value="1-2">Easy to Apply (1-2 reqs)</option>
                    <option value="3-5">Moderate Work (3-5 reqs)</option>
                    <option value="5+">A Lot of Work (5+ reqs)</option>
                  </select>
                </div>

                <div className={styles.filterSection}>
                  <div className={styles.filterHeader}>
                    <h4 className={styles.filterTitle}>Min Award Amount</h4>
                    <span className={styles.filterValue}>${minAmount.toLocaleString()}+</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20000" 
                    step="500"
                    className={styles.rangeSlider} 
                    value={minAmount} 
                    onChange={(e) => setMinAmount(Number(e.target.value))} 
                  />
                </div>
              </aside>

              <main className={styles.mainContent}>
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
                      <span className={styles.metaValue}>{s.parsedDeadline?.display || "N/A"}</span>
                    </div>
                  </div>

                  {s.purpose && (
                    <p className={styles.cardPurpose}>
                      {s.purpose}
                      {s.purpose.length >= 200 ? "..." : ""}
                    </p>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.badges}>
                      <span
                        className={`${styles.matchBadge} ${
                          s.matchScore >= 80 ? styles.matchHigh : styles.matchMedium
                        }`}
                      >
                        {s.matchScore}% match
                      </span>
                      <span className={styles.reqBadge}>
                        {s.submissionRequirementsCount} req{s.submissionRequirementsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
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
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
