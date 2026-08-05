"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./page.module.css";
import { Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────
type QuestionType = "numeric" | "single_select" | "multi_select" | "boolean" | "text" | "entity_lookup" | "entity_lookup_multi" | "numeric_entity_map" | "entity_lookup_multi_with_status";

type QuestionDef = {
  question: string;
  type: QuestionType;
  pre_seeded?: string[];
  allow_new?: boolean;
  optional?: boolean;
  optional_na?: boolean;
  na_label?: string;
  depends_on?: Record<string, string[] | string>;
  db_key?: string;
  order: number;
  comparison?: string;
  scale?: number;
  note?: string;
  statuses?: string[];
};

type SchemaMap = Record<string, QuestionDef>;

// Map schema keys to profile keys (camelCase)
const keyToProfileKey: Record<string, string> = {
  age: "age",
  gender: "gender",
  race: "race",
  ethnicity: "ethnicity",
  lgbtq: "lgbtq",
  country_of_residence: "countryOfResidence",
  us_state: "usState",
  us_county_city: "usCountyCity",
  canadian_province: "canadianProvince",
  citizenship_status: "citizenshipStatus",
  visa_type: "visaType",
  education_type: "educationType",
  degree_pursuing: "degreePursuing",
  degrees_held: "degreesHeld",
  year_of_study: "yearOfStudy",
  enrollment_status: "enrollmentStatus",
  institution_name: "institutionName",
  institution_type: "institutionType",
  gpa: "gpa",
  credit_hours_completed: "creditHoursCompleted",
  field_of_study: "fieldOfStudy",
  minor: "minor",
  sat_score: "satScore",
  act_score: "actScore",
  other_test_scores: "otherTestScores",
  financial_need: "financialNeed",
  military: "military",
  first_generation: "firstGeneration",
  foster_care: "fosterCare",
  disability: "disability",
  medical_condition_detail: "medicalConditionDetail",
  community_service: "communityService",
  memberships: "memberships",
  career_goals: "careerGoals",
};

// Loaded dynamically via API now
export default function QuestionnairePage() {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();

  const [schema, setSchema] = useState<SchemaMap>({});
  const [entityDatabase, setEntityDatabase] = useState<Record<string, string[]>>({});
  const [configLoading, setConfigLoading] = useState(true);
  // Build ordered list of visible questions based on dependencies
  const visibleQuestions = useMemo(() => {
    const allQuestions = Object.entries(schema)
      .sort(([, a], [, b]) => a.order - b.order);

    return allQuestions.filter(([, def]) => {
      if (!def.depends_on) return true;

      for (const [depKey, depValues] of Object.entries(def.depends_on)) {
        const profileKey = keyToProfileKey[depKey] || depKey;
        const userAnswer = answers[profileKey] ?? answers[depKey];

        if (depValues === "*") {
          // Any non-null answer satisfies
          if (userAnswer === null || userAnswer === undefined || userAnswer === "") return false;
        } else {
          const allowed = Array.isArray(depValues) ? depValues : [depValues];
          if (Array.isArray(userAnswer)) {
            if (!allowed.some((dv) => userAnswer.includes(dv))) return false;
          } else {
            if (!allowed.includes(userAnswer as string)) return false;
          }
        }
      }
      return true;
    });
  }, [schema, answers]);

  const currentQuestion = visibleQuestions[currentStep];
  const totalSteps = visibleQuestions.length;
  const progress = totalSteps > 0 ? ((currentStep) / totalSteps) * 100 : 0;

  // Load existing profile on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((res) => res.json()),
      fetch("/api/schema").then((res) => res.json()),
      fetch("/api/entity-db").then((res) => res.json()),
    ])
      .then(([profileData, schemaData, entityData]) => {
        if (profileData.profile) {
          setAnswers(profileData.profile);
          if (profileData.completed) {
            setCompleted(true);
            router.push("/profile");
          }
        }
        if (schemaData) setSchema(schemaData);
        if (entityData) setEntityDatabase(entityData);
        setLoading(false);
        setConfigLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setConfigLoading(false);
      });
  }, [router]);

  // Get the profile key for current question
  const getProfileKey = useCallback(
    (schemaKey: string) => keyToProfileKey[schemaKey] || schemaKey,
    []
  );

  // Save answers to the server
  const saveAnswers = useCallback(
    async (updatedAnswers: Record<string, unknown>, markComplete = false) => {
      setSaving(true);
      try {
        const payload = markComplete
          ? { ...updatedAnswers, questionnaireCompleted: true }
          : updatedAnswers;
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleAnswer = (schemaKey: string, value: unknown) => {
    const profileKey = getProfileKey(schemaKey);
    setAnswers((prev) => ({ ...prev, [profileKey]: value }));
  };

  const handleNext = async () => {
    if (currentStep >= totalSteps - 1) {
      // Last question — complete the questionnaire
      await saveAnswers(answers, true);
      setCompleted(true);
      router.push("/profile");
      return;
    }
    // Save current progress
    await saveAnswers(answers);
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await saveAnswers(answers, true);
      setCompleted(true);
      router.push("/profile");
    }
  };

  if (loading) {
    return (
      <div className={styles.questionnairePage}>
        <Header />
        <div className={styles.loading}>Loading your profile...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className={styles.questionnairePage}>
        <Header />
        <div className={styles.questionnaireInner}>
          <div className={`card ${styles.completeCard}`}>
            <div className={styles.completeIcon}>✦</div>
            <h2 className={styles.completeTitle}>Profile complete!</h2>
            <p className={styles.completeSubtitle}>
              Your answers have been saved. Head to your scholarships to see matches.
            </p>
            <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center" }}>
              <Link href="/scholarships" className="btn btn--primary btn--large">
                View My Scholarships
              </Link>
              <Link href="/dashboard" className="btn btn--ghost btn--large">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || configLoading) {
    return (
      <div className={styles.questionnairePage}>
        <Header />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Loading questionnaire...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={styles.questionnairePage}>
        <Header />
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <p>No questions available.</p>
          </div>
        </div>
      </div>
    );
  }

  const [schemaKey, questionDef] = currentQuestion;
  const profileKey = getProfileKey(schemaKey);
  const currentValue = answers[profileKey];

  return (
    <div className={styles.questionnairePage}>
      <Header />
      <div className={styles.questionnaireInner}>
        {/* Progress bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Your Profile</span>
            <span className={styles.progressCount}>
              {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className={styles.questionCard} key={schemaKey}>
          <p className={styles.questionNumber}>
            Question {currentStep + 1}
          </p>
          <h2 className={styles.questionText}>{questionDef.question}</h2>

          {/* Render input based on type */}
          <QuestionInput
            schemaKey={schemaKey}
            def={questionDef}
            value={currentValue}
            onChange={(val) => handleAnswer(schemaKey, val)}
            entityDatabase={entityDatabase}
          />
        </div>

        {/* Navigation */}
        <div className={styles.navButtons}>
          <button
            className={styles.skipButton}
            onClick={handleBack}
            disabled={currentStep === 0}
            style={{ visibility: currentStep === 0 ? "hidden" : "visible" }}
          >
            ← Back
          </button>

          <div className={styles.navRight}>
            {(questionDef.optional || questionDef.optional_na) && (
              <button
                className={styles.skipButton}
                onClick={handleSkip}
              >
                Skip
              </button>
            )}
            <button
              className="btn btn--primary"
              onClick={handleNext}
              disabled={saving}
              id="questionnaire-next-btn"
            >
              {saving
                ? "Saving..."
                : currentStep >= totalSteps - 1
                  ? "Complete Profile"
                  : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Question Input Component ────────────────────────────
function QuestionInput({
  schemaKey,
  def,
  value,
  onChange,
  entityDatabase,
}: {
  schemaKey: string;
  def: QuestionDef;
  value: unknown;
  onChange: (val: unknown) => void;
  entityDatabase: Record<string, string[]>;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  switch (def.type) {
    case "numeric":
      return (
        <div>
          <input
            type="number"
            className={`input ${styles.numericInput}`}
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) => {
              const num = e.target.value === "" ? null : Number(e.target.value);
              onChange(num);
            }}
            step={def.scale ? 0.01 : 1}
            min={0}
            max={def.scale || undefined}
            placeholder={def.scale ? `0.00 - ${def.scale}` : "Enter a number"}
            id={`input-${schemaKey}`}
          />
          {def.optional_na && def.na_label && (
            <button
              className={`${styles.optionButton} ${value === "N/A" ? styles.optionButtonSelected : ""}`}
              onClick={() => onChange(value === "N/A" ? null : "N/A")}
              style={{ marginTop: "var(--space-3)", maxWidth: 300 }}
            >
              <span
                className={`${styles.optionIndicator} ${value === "N/A" ? styles.optionIndicatorSelected : ""}`}
              >
                {value === "N/A" && <span className={styles.optionIndicatorDot} />}
              </span>
              {def.na_label}
            </button>
          )}
        </div>
      );

    case "boolean":
      return (
        <div className={styles.optionGrid}>
          {[
            { label: "Yes", val: true },
            { label: "No", val: false },
          ].map((opt) => (
            <button
              key={String(opt.val)}
              className={`${styles.optionButton} ${value === opt.val ? styles.optionButtonSelected : ""}`}
              onClick={() => onChange(opt.val)}
            >
              <span
                className={`${styles.optionIndicator} ${value === opt.val ? styles.optionIndicatorSelected : ""}`}
              >
                {value === opt.val && <span className={styles.optionIndicatorDot} />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      );

    case "single_select":
      return (
        <div className={styles.optionGrid}>
          {(def.pre_seeded || []).map((option) => (
            <button
              key={option}
              className={`${styles.optionButton} ${value === option ? styles.optionButtonSelected : ""}`}
              onClick={() => onChange(option)}
            >
              <span
                className={`${styles.optionIndicator} ${value === option ? styles.optionIndicatorSelected : ""}`}
              >
                {value === option && <span className={styles.optionIndicatorDot} />}
              </span>
              {option}
            </button>
          ))}
        </div>
      );

    case "multi_select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className={styles.optionGrid}>
          {(def.pre_seeded || []).map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                className={`${styles.optionButton} ${isSelected ? styles.optionButtonSelected : ""}`}
                onClick={() => {
                  const newVal = isSelected
                    ? selected.filter((s) => s !== option)
                    : [...selected, option];
                  onChange(newVal);
                }}
              >
                <span
                  className={`${styles.optionIndicator} ${styles.optionIndicatorSquare} ${isSelected ? styles.optionIndicatorSelected : ""}`}
                >
                  {isSelected && <span className={styles.checkMark}>✓</span>}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    case "text":
      return (
        <input
          type="text"
          className={`input ${styles.textInput}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          id={`input-${schemaKey}`}
        />
      );

    case "entity_lookup": {
      const dbKey = def.db_key || "";
      const options = entityDatabase[dbKey] || [];
      const safeQuery = searchQuery || "";
      const filtered = safeQuery
        ? options.filter((o) => o && typeof o === "string" && o.toLowerCase().includes(safeQuery.toLowerCase()))
        : options.slice(0, 20);

      const allowAdd = !["career_goals", "memberships"].includes(schemaKey);
      const exactMatch = options.find((o) => o && typeof o === "string" && o.toLowerCase() === safeQuery.trim().toLowerCase());

      return (
        <div className={styles.searchableWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery || (typeof value === "string" ? value : "")}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) onChange(null);
            }}
            placeholder="Search..."
            id={`search-${schemaKey}`}
          />
          {!allowAdd && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              If you don't see what you are searching for, select "None of the above"
            </p>
          )}
          {searchQuery && (filtered.length > 0 || (allowAdd && !exactMatch && searchQuery.trim() !== "")) && (
            <div className={styles.searchDropdown}>
              {filtered.slice(0, 15).map((opt) => (
                <div
                  key={opt}
                  className={`${styles.searchOption} ${value === opt ? styles.searchOptionSelected : ""}`}
                  onClick={() => {
                    onChange(opt);
                    setSearchQuery("");
                  }}
                >
                  {opt}
                </div>
              ))}
              {allowAdd && searchQuery.trim() !== "" && !exactMatch && (
                <div
                  className={styles.searchOption}
                  onClick={() => {
                    const newVal = searchQuery.trim();
                    onChange(newVal);
                    setSearchQuery("");
                    fetch("/api/entity-db", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ category: dbKey, entity: newVal })
                    }).catch(e => console.error(e));
                  }}
                >
                  Add "{searchQuery.trim()}"
                </div>
              )}
            </div>
          )}
          {typeof value === "string" && value && !searchQuery && value !== def.na_label && (
            <div className={styles.selectedTags}>
              <span className={styles.tag}>
                {value}
                <button className={styles.tagRemove} onClick={() => onChange(null)}>
                  ×
                </button>
              </span>
            </div>
          )}
          {def.optional_na && def.na_label && (
            <button
              className={`${styles.optionButton} ${value === def.na_label ? styles.optionButtonSelected : ""}`}
              onClick={() => {
                onChange(value === def.na_label ? null : def.na_label);
                setSearchQuery("");
              }}
              style={{ marginTop: "var(--space-3)", maxWidth: 300 }}
            >
              <span
                className={`${styles.optionIndicator} ${value === def.na_label ? styles.optionIndicatorSelected : ""}`}
              >
                {value === def.na_label && <span className={styles.optionIndicatorDot} />}
              </span>
              {def.na_label}
            </button>
          )}
        </div>
      );
    }

    case "entity_lookup_multi": {
      const dbKey = def.db_key || "";
      const options = entityDatabase[dbKey] || [];
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const safeQuery = searchQuery || "";
      const filtered = safeQuery
        ? options.filter(
            (o) =>
              o && typeof o === "string" &&
              o.toLowerCase().includes(safeQuery.toLowerCase()) &&
              !selected.includes(o)
          )
        : [];
        
      const allowAdd = !["career_goals", "memberships"].includes(schemaKey);
      const exactMatch = options.find((o) => o && typeof o === "string" && o.toLowerCase() === safeQuery.trim().toLowerCase());
      const alreadySelected = selected.some((s) => s && typeof s === "string" && s.toLowerCase() === safeQuery.trim().toLowerCase());

      return (
        <div className={styles.searchableWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search and select..."
            id={`search-${schemaKey}`}
          />
          {!allowAdd && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              If you don't see what you are searching for, select "None of the above"
            </p>
          )}
          {searchQuery && (filtered.length > 0 || (allowAdd && !exactMatch && !alreadySelected && searchQuery.trim() !== "")) && (
            <div className={styles.searchDropdown}>
              {filtered.slice(0, 15).map((opt) => (
                <div
                  key={opt}
                  className={styles.searchOption}
                  onClick={() => {
                    onChange(
                      selected.includes(def.na_label as string)
                        ? [opt]
                        : [...selected, opt]
                    );
                    setSearchQuery("");
                  }}
                >
                  {opt}
                </div>
              ))}
              {allowAdd && searchQuery.trim() !== "" && !exactMatch && !alreadySelected && (
                <div
                  className={styles.searchOption}
                  onClick={() => {
                    const newVal = searchQuery.trim();
                    onChange(
                      selected.includes(def.na_label as string)
                        ? [newVal]
                        : [...selected, newVal]
                    );
                    setSearchQuery("");
                    fetch("/api/entity-db", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ category: dbKey, entity: newVal })
                    }).catch(e => console.error(e));
                  }}
                >
                  Add "{searchQuery.trim()}"
                </div>
              )}
            </div>
          )}
          {selected.length > 0 && (
            <div className={styles.selectedTags}>
              {selected.map((s) => (
                <span key={s} className={styles.tag}>
                  {s}
                  <button
                    className={styles.tagRemove}
                    onClick={() => onChange(selected.filter((v) => v !== s))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {def.optional_na && def.na_label && (
            <button
              className={`${styles.optionButton} ${selected.includes(def.na_label) ? styles.optionButtonSelected : ""}`}
              onClick={() => {
                onChange(selected.includes(def.na_label as string) ? [] : [def.na_label]);
                setSearchQuery("");
              }}
              style={{ marginTop: "var(--space-3)", maxWidth: 300 }}
            >
              <span
                className={`${styles.optionIndicator} ${selected.includes(def.na_label) ? styles.optionIndicatorSelected : ""}`}
              >
                {selected.includes(def.na_label) && <span className={styles.optionIndicatorDot} />}
              </span>
              {def.na_label}
            </button>
          )}
        </div>
      );
    }

    case "entity_lookup_multi_with_status": {
      const dbKey = def.db_key || "";
      const options = entityDatabase[dbKey] || [];
      const selected = Array.isArray(value) ? (value as any[]) : [];
      const statuses = def.statuses || [];
      const filtered = searchQuery
        ? options.filter(
            (o) =>
              o.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !selected.some(s => s.organization === o)
          )
        : [];
        
      const allowAdd = !["career_goals", "memberships"].includes(schemaKey);
      const exactMatch = options.find((o) => o.toLowerCase() === searchQuery.trim().toLowerCase());
      const alreadySelected = selected.some((s) => s.organization?.toLowerCase() === searchQuery.trim().toLowerCase());

      return (
        <div className={styles.searchableWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search and select..."
            id={`search-${schemaKey}`}
          />
          {!allowAdd && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              If you don't see what you are searching for, select "None of the above"
            </p>
          )}
          {searchQuery && (filtered.length > 0 || (allowAdd && !exactMatch && !alreadySelected && searchQuery.trim() !== "")) && (
            <div className={styles.searchDropdown}>
              {filtered.slice(0, 15).map((opt) => (
                <div
                  key={opt}
                  className={styles.searchOption}
                  onClick={() => {
                    const defaultStatus = statuses[0] || "";
                    onChange(
                      selected.some(s => typeof s === "string" && s === def.na_label)
                        ? [{ organization: opt, status: defaultStatus }]
                        : [...selected, { organization: opt, status: defaultStatus }]
                    );
                    setSearchQuery("");
                  }}
                >
                  {opt}
                </div>
              ))}
              {allowAdd && searchQuery.trim() !== "" && !exactMatch && !alreadySelected && (
                <div
                  className={styles.searchOption}
                  onClick={() => {
                    const newVal = searchQuery.trim();
                    const defaultStatus = statuses[0] || "";
                    onChange(
                      selected.some(s => typeof s === "string" && s === def.na_label)
                        ? [{ organization: newVal, status: defaultStatus }]
                        : [...selected, { organization: newVal, status: defaultStatus }]
                    );
                    setSearchQuery("");
                    fetch("/api/entity-db", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ category: dbKey, entity: newVal })
                    }).catch(e => console.error(e));
                  }}
                >
                  Add "{searchQuery.trim()}"
                </div>
              )}
            </div>
          )}
          {selected.length > 0 && (
            <div className={styles.selectedTags} style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
              {selected.map((s, idx) => {
                if (typeof s === "string") {
                  return (
                    <span key={`str-${idx}`} className={styles.tag}>
                      {s}
                      <button
                        className={styles.tagRemove}
                        onClick={() => onChange(selected.filter((v) => v !== s))}
                      >
                        ×
                      </button>
                    </span>
                  );
                }
                return (
                  <div key={s.organization} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className={styles.tag}>
                      {s.organization}
                      <button
                        className={styles.tagRemove}
                        onClick={() => onChange(selected.filter((v) => v.organization !== s.organization))}
                      >
                        ×
                      </button>
                    </span>
                    <select
                      className={`input ${styles.textInput}`}
                      style={{ padding: "4px 8px", minHeight: "auto", fontSize: "0.9rem", width: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
                      value={s.status || ""}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const newSelected = selected.map(item => 
                          item.organization === s.organization ? { ...item, status: newStatus } : item
                        );
                        onChange(newSelected);
                      }}
                    >
                      <option value="" disabled>Select Status</option>
                      {statuses.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
          {def.optional_na && def.na_label && (
            <button
              className={`${styles.optionButton} ${selected.some(s => typeof s === "string" && s === def.na_label) ? styles.optionButtonSelected : ""}`}
              onClick={() => {
                onChange(selected.some(s => typeof s === "string" && s === def.na_label) ? [] : [def.na_label]);
                setSearchQuery("");
              }}
              style={{ marginTop: "var(--space-3)", maxWidth: 300 }}
            >
              <span
                className={`${styles.optionIndicator} ${selected.some(s => typeof s === "string" && s === def.na_label) ? styles.optionIndicatorSelected : ""}`}
              >
                {selected.some(s => typeof s === "string" && s === def.na_label) && <span className={styles.optionIndicatorDot} />}
              </span>
              {def.na_label}
            </button>
          )}
        </div>
      );
    }

    default:
      return (
        <input
          type="text"
          className={`input ${styles.textInput}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
        />
      );
  }
}
