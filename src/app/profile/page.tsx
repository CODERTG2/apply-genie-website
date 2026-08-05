"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";
import { Check, X, Edit2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Types
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

// They will be loaded dynamically via API now
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

  const [schema, setSchema] = useState<SchemaMap>({});
  const [entityDatabase, setEntityDatabase] = useState<Record<string, string[]>>({});
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((res) => res.json()),
      fetch("/api/schema").then((res) => res.json()),
      fetch("/api/entity-db").then((res) => res.json()),
    ])
      .then(([profileData, schemaData, entityData]) => {
        if (profileData.profile) setAnswers(profileData.profile);
        if (schemaData) setSchema(schemaData);
        if (entityData) setEntityDatabase(entityData);
        setLoading(false);
        setConfigLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setConfigLoading(false);
      });
      
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
      const userAnswer = currentAnswers[profileKey] ?? currentAnswers[depKey];
      if (depValues === "*") {
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
                          entityDatabase={entityDatabase}
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
                      displayVal = val.length > 0 
                        ? val.map(item => {
                            if (typeof item === 'object' && item !== null && 'organization' in item) {
                              return item.status ? `${item.organization} (${item.status})` : item.organization;
                            }
                            return String(item);
                          }).join(", ") 
                        : "Not set";
                      if (val.length === 0) isEmpty = true;
                    } else if (typeof val === "object") {
                      const entries = Object.entries(val as Record<string, unknown>);
                      displayVal = entries.length > 0 ? entries.map(([k, v]) => `${k}: ${v}`).join(", ") : "Not set";
                      if (entries.length === 0) isEmpty = true;
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
  entityDatabase,
}: {
  schemaKey: string;
  def: QuestionDef;
  value: unknown;
  onChange: (val: unknown) => void;
  entityDatabase: Record<string, string[]>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const isEditing = true;

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

    case "numeric_entity_map": {
      const dbKey = def.db_key || "";
      const options = entityDatabase[dbKey] || [];
      const mapVal =
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, number | string>)
          : {};
      const isNa = value === def.na_label;

      return (
        <div className={styles.searchableWrapper}>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
            {options.map((testName) => {
              const currentScore = mapVal[testName] ?? "";
              return (
                <div
                  key={testName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    background: "var(--surface-subtle)",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{testName}:</span>
                  <input
                    type="number"
                    className="input"
                    style={{ width: "90px", padding: "4px 8px" }}
                    placeholder="Score"
                    value={currentScore !== undefined && currentScore !== null ? String(currentScore) : ""}
                    onChange={(e) => {
                      const num = e.target.value === "" ? undefined : Number(e.target.value);
                      const nextMap = { ...mapVal };
                      if (num === undefined) {
                        delete nextMap[testName];
                      } else {
                        nextMap[testName] = num;
                      }
                      onChange(Object.keys(nextMap).length > 0 ? nextMap : null);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {def.optional_na && def.na_label && (
            <button
              className={`${styles.optionButton} ${isNa ? styles.optionButtonSelected : ""}`}
              onClick={() => {
                onChange(isNa ? null : def.na_label);
              }}
              style={{ marginTop: "var(--space-2)", maxWidth: 300 }}
            >
              <span
                className={`${styles.optionIndicator} ${isNa ? styles.optionIndicatorSelected : ""}`}
              >
                {isNa && <span className={styles.optionIndicatorDot} />}
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
            disabled={!isEditing}
          />
          {!allowAdd && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              If you don't see what you are searching for, select "None of the above"
            </p>
          )}
          {isEditing && searchQuery && (filtered.length > 0 || (allowAdd && !exactMatch && !alreadySelected && searchQuery.trim() !== "")) && (
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
                      {isEditing && (
                        <button
                          className={styles.tagRemove}
                          onClick={() => onChange(selected.filter((v) => v !== s))}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                }
                return (
                  <div key={s.organization} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className={styles.tag}>
                      {s.organization}
                      {isEditing && (
                        <button
                          className={styles.tagRemove}
                          onClick={() => onChange(selected.filter((v) => v.organization !== s.organization))}
                        >
                          ×
                        </button>
                      )}
                    </span>
                    <select
                      className={`input ${styles.textInput}`}
                      style={{ padding: "4px 8px", minHeight: "auto", fontSize: "0.9rem", width: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
                      value={s.status || ""}
                      disabled={!isEditing}
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
                if (!isEditing) return;
                onChange(selected.some(s => typeof s === "string" && s === def.na_label) ? [] : [def.na_label]);
                setSearchQuery("");
              }}
              style={{ marginTop: "var(--space-3)", maxWidth: 300, cursor: isEditing ? "pointer" : "default" }}
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
          className={`input ${styles.input}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
        />
      );
  }
}
