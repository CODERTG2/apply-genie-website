"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";
import attributeSchema from "../../../attribute_schema.json";
import entityDb from "../../../entity_db.json";
import { Check, X, Edit2 } from "lucide-react";
import { motion } from "framer-motion";

// Types
type QuestionType = "numeric" | "single_select" | "multi_select" | "boolean" | "text" | "entity_lookup" | "entity_lookup_multi" | "numeric_entity_map";

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
};

type SchemaMap = Record<string, QuestionDef>;

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

const entityDatabase = entityDb as Record<string, string[]>;
const schema = attributeSchema as SchemaMap;

const SECTIONS = [
  {
    id: "demographics",
    title: "Demographics",
    keys: ["age", "gender", "race", "ethnicity", "lgbtq"]
  },
  {
    id: "location",
    title: "Location",
    keys: ["country_of_residence", "us_state", "us_county_city", "canadian_province"]
  },
  {
    id: "citizenship",
    title: "Citizenship",
    keys: ["citizenship_status", "visa_type"]
  },
  {
    id: "education",
    title: "Education",
    keys: ["education_type", "degree_pursuing", "year_of_study", "enrollment_status", "institution_name", "institution_type", "gpa", "credit_hours_completed"]
  },
  {
    id: "academics",
    title: "Academics",
    keys: ["field_of_study", "minor", "sat_score", "act_score", "other_test_scores"]
  },
  {
    id: "financial",
    title: "Financial & Background",
    keys: ["financial_need", "military", "first_generation", "foster_care", "disability", "medical_condition_detail"]
  },
  {
    id: "activities",
    title: "Activities & Goals",
    keys: ["community_service", "memberships", "career_goals"]
  }
];

export default function ProfilePage() {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editAnswers, setEditAnswers] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  
  const [requirements, setRequirements] = useState<Array<any>>([]);
  const [reqsLoading, setReqsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setAnswers(data.profile);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
      
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      const res = await fetch("/api/requirements/responses");
      const data = await res.json();
      if (data.responses) {
        setRequirements(data.responses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReqsLoading(false);
    }
  };

  const getProfileKey = (schemaKey: string) => keyToProfileKey[schemaKey] || schemaKey;

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEdit = (sectionId: string) => {
    setEditAnswers({ ...answers });
    setEditingSection(sectionId);
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAnswers),
      });
      setAnswers(editAnswers);
      setEditingSection(null);
    } catch (e) {
      console.error("Failed to save profile", e);
    } finally {
      setSaving(false);
    }
  };

  const handleAnswer = (schemaKey: string, value: unknown) => {
    const profileKey = getProfileKey(schemaKey);
    setEditAnswers((prev) => ({ ...prev, [profileKey]: value }));
  };

  const toggleRequirement = async (req: any) => {
    const newIsMet = !req.isMet;
    // Optimistic update
    setRequirements((prev) => 
      prev.map(r => r.id === req.id ? { ...r, isMet: newIsMet } : r)
    );
    try {
      await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: req.requirement, isMet: newIsMet }),
      });
    } catch (error) {
      console.error("Failed to toggle requirement", error);
      // Revert on error
      setRequirements((prev) => 
        prev.map(r => r.id === req.id ? { ...r, isMet: req.isMet } : r)
      );
    }
  };

  const isFieldVisible = (def: QuestionDef, currentAnswers: Record<string, unknown>) => {
    if (!def.depends_on) return true;
    for (const [depKey, depValues] of Object.entries(def.depends_on)) {
      const profileKey = getProfileKey(depKey);
      const userAnswer = currentAnswers[profileKey];
      if (depValues === "*") {
        if (userAnswer === null || userAnswer === undefined || userAnswer === "") return false;
      } else if (Array.isArray(depValues)) {
        if (Array.isArray(userAnswer)) {
          if (!depValues.some((dv) => userAnswer.includes(dv))) return false;
        } else {
          if (!depValues.includes(userAnswer as string)) return false;
        }
      }
    }
    return true;
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <Header />
        <div className={styles.loading}>Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <Header />
      <div className={styles.inner}>
        <motion.div 
          className={styles.pageHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.pageTitle}>Your Profile</h1>
          <p className={styles.pageSubtitle}>Review and edit your dossier for precise scholarship matching.</p>
        </motion.div>

        <div className={styles.layout}>
          {/* Sticky Sidebar */}
          <motion.nav 
            className={styles.sidebar}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {SECTIONS.map((section) => (
              <a 
                key={`nav-${section.id}`} 
                href={`#${section.id}`}
                className={styles.sidebarLink}
                onClick={(e) => scrollToSection(e, section.id)}
              >
                {section.title}
              </a>
            ))}
            <a 
              href="#requirements"
              className={styles.sidebarLink}
              onClick={(e) => scrollToSection(e, "requirements")}
              style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-subtle)" }}
            >
              Specific Requirements
            </a>
          </motion.nav>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {SECTIONS.map((section, index) => {
              const isEditing = editingSection === section.id;
              const currentData = isEditing ? editAnswers : answers;

              return (
                <motion.div 
                  id={section.id}
                  key={section.id} 
                  className={styles.section}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                {!isEditing && (
                  <button className="btn btn--ghost" onClick={() => handleEdit(section.id)}>
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </div>

              <div className={styles.fieldGrid}>
                {section.keys.map((schemaKey) => {
                  const def = schema[schemaKey];
                  if (!def) return null;
                  
                  if (!isFieldVisible(def, currentData)) return null;

                  const profileKey = getProfileKey(schemaKey);
                  const val = currentData[profileKey];

                  if (isEditing) {
                    return (
                      <div key={schemaKey} className={styles.fieldRow}>
                        <label className={styles.fieldLabel}>{def.question}</label>
                        <QuestionInput
                          schemaKey={schemaKey}
                          def={def}
                          value={val}
                          onChange={(newVal) => handleAnswer(schemaKey, newVal)}
                        />
                      </div>
                    );
                  }

                  // Display mode
                  let displayVal = "Not set";
                  let isEmpty = true;

                  if (val !== null && val !== undefined && val !== "") {
                    isEmpty = false;
                    if (typeof val === "boolean") {
                      displayVal = val ? "Yes" : "No";
                    } else if (Array.isArray(val)) {
                      displayVal = val.length > 0 ? val.join(", ") : "Not set";
                      if (val.length === 0) isEmpty = true;
                    } else {
                      displayVal = String(val);
                    }
                  }

                  return (
                    <div key={schemaKey} className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>{def.question}</span>
                      <span className={`${styles.fieldValue} ${isEmpty ? styles.fieldValueEmpty : ""}`}>
                        {!isEmpty && <Check size={16} className={styles.checkIcon} />}
                        {displayVal}
                      </span>
                    </div>
                  );
                })}
              </div>

              {isEditing && (
                <div className={styles.actions}>
                  <button className="btn btn--ghost" onClick={handleCancel} disabled={saving}>Cancel</button>
                  <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
              </motion.div>
            );
          })}

          {/* Requirements Section */}
          <motion.div 
            id="requirements"
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * SECTIONS.length }}
          >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Requirement Responses</h2>
          </div>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-6)" }}>
            Review and change your answers to specific scholarship requirements you've seen.
          </p>
          
          {reqsLoading ? (
             <div className={styles.loading}>Loading responses...</div>
          ) : requirements.length === 0 ? (
            <div className={styles.emptyReqs}>
              You haven't answered any specific requirements yet. Check your dashboard to swipe on requirements!
            </div>
          ) : (
            <div className={styles.reqList}>
              {requirements.map((req) => (
                <div key={req.id} className={styles.reqItem}>
                  <div className={styles.reqContent}>
                    <div className={styles.reqDescription}>{req.requirement}</div>
                    <div className={styles.reqScholarship}>Scholarship: {req.scholarshipTitle}</div>
                  </div>
                  <button 
                    className={`${styles.reqToggle} ${req.isMet ? styles.reqToggleMet : styles.reqToggleNotMet}`}
                    onClick={() => toggleRequirement(req)}
                  >
                    {req.isMet ? (
                      <><Check size={16} /> Met</>
                    ) : (
                      <><X size={16} /> Not Met</>
                    )}
                  </button>
                </div>
              ))}
            </div>
            )}
          </motion.div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Question Input Component (Shared from Questionnaire) ────────────────────────────
function QuestionInput({
  schemaKey,
  def,
  value,
  onChange,
}: {
  schemaKey: string;
  def: QuestionDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  switch (def.type) {
    case "numeric":
      return (
        <div>
          <input
            type="number"
            className={`input ${styles.input}`}
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
          className={`input ${styles.input}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          id={`input-${schemaKey}`}
        />
      );

    case "entity_lookup": {
      const dbKey = def.db_key || "";
      const options = entityDatabase[dbKey] || [];
      const filtered = searchQuery
        ? options.filter((o) => o.toLowerCase().includes(searchQuery.toLowerCase()))
        : options.slice(0, 20);

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
          {searchQuery && filtered.length > 0 && (
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
      const filtered = searchQuery
        ? options.filter(
            (o) =>
              o.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !selected.includes(o)
          )
        : [];

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
          {searchQuery && filtered.length > 0 && (
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

    default:
      return (
        <input
          type="text"
          className={`input ${styles.input}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
        />
      );
  }
}
