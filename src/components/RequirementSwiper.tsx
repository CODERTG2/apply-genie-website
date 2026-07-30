"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Check, X, Loader2, Sparkles, AlertCircle } from "lucide-react";

type Requirement = {
  type: string;
  description: string;
  category_hint?: string;
  source_text?: string;
  associatedScholarshipScore: number;
  scholarshipTitle: string;
};

function SwipeCard({
  req,
  index,
  total,
  onSwipe,
}: {
  req: Requirement;
  index: number;
  total: number;
  onSwipe: (direction: "left" | "right", req: Requirement) => void;
}) {
  const isTop = index === 0;
  const x = useMotionValue(0);

  // Transform values for a polished, smooth swipe effect
  const rotate = useTransform(x, [-200, 200], [-8, 8]);

  // Subtle overlay colors based on swipe direction using custom design system colors
  const yesOpacity = useTransform(x, [0, 150], [0, 1]);
  const noOpacity = useTransform(x, [0, -150], [0, 1]);

  // Depth scaling for cards behind the top one
  const scale = useTransform(x, [-200, 0, 200], [0.98, 1, 0.98]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      onSwipe("right", req);
    } else if (info.offset.x < -swipeThreshold) {
      onSwipe("left", req);
    }
  };

  return (
    <motion.div
      className="card"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: isTop ? "grab" : "default",
        padding: "var(--space-8)",
        borderRadius: "var(--radius-xl)",
        background: "var(--bg-surface)",
        overflow: "hidden",
        border: "1.5px solid var(--border-subtle)",
        zIndex: total - index,
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: isTop ? scale : 1,
      }}
      initial={
        isTop
          ? { scale: 1, y: 0 }
          : { scale: 0.92, y: 24, opacity: 0.5 }
      }
      animate={
        isTop
          ? { scale: 1, y: 0, opacity: 1, boxShadow: "var(--shadow-lg)" }
          : { scale: 1 - index * 0.04, y: index * 16, opacity: 1 - index * 0.15, boxShadow: "var(--shadow-sm)" }
      }
      exit={{
        opacity: 0,
        scale: 0.85,
        transition: { duration: 0.2 },
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02, cursor: "grabbing", boxShadow: "var(--shadow-lg)" }}
    >
      {/* Yes Overlay (Green/Success) */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--success-bg)",
          opacity: yesOpacity,
          pointerEvents: "none",
        }}
      />
      {/* No Overlay (Red) */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(225, 29, 72, 0.08)", // subtle red
          opacity: noOpacity,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Header: Hint & Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", gap: "var(--space-4)" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--brand-gold)",
            background: "var(--brand-gold-glow)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-full)",
            flexShrink: 0
          }}>
            <Sparkles size={14} />
            {req.category_hint || "Requirement"}
          </span>

          <span style={{
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "right"
          }}>
            {req.scholarshipTitle}
          </span>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 var(--space-2)"
        }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            lineHeight: "var(--leading-tight)",
            color: "var(--text-heading)",
            margin: 0
          }}>
            {req.description}
          </h3>
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: "var(--space-8)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 var(--space-4)"
        }}>
          {/* No Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSwipe("left", req)}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-2)",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-surface)",
              border: "1.5px solid var(--border-strong)",
              color: "#E11D48",
              boxShadow: "var(--shadow-sm)"
            }}>
              <X size={28} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>No</span>
          </motion.button>

          {/* Yes Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSwipe("right", req)}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-2)",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-surface)",
              border: "1.5px solid var(--border-strong)",
              color: "var(--success-text)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <Check size={28} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>Yes</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function RequirementSwiper() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRequirements();
  }, []);

  async function fetchRequirements() {
    try {
      const res = await fetch("/api/requirements");
      const data = await res.json();
      if (data.requirements) {
        setRequirements(data.requirements);
      } else {
        setError(data.error || "Failed to load requirements");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const handleSwipe = async (direction: "left" | "right", requirement: Requirement) => {
    const isMet = direction === "right";

    // Optimistic UI update
    setRequirements((prev) => prev.slice(1));

    try {
      await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: requirement.description, isMet }),
      });
    } catch (error) {
      console.error("Failed to submit swipe", error);
    }
  };

  if (loading) {
    return (
      <div style={{
        width: "100%",
        maxWidth: "420px",
        height: "480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-glass)",
        borderRadius: "var(--radius-xl)",
        border: "1.5px dashed var(--border-strong)"
      }}>
        <Loader2 style={{ color: "var(--accent-main)", width: "40px", height: "40px", marginBottom: "var(--space-4)", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--text-muted)", fontWeight: 500 }}>Summoning requirements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: "100%",
        maxWidth: "420px",
        height: "480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(225, 29, 72, 0.05)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid rgba(225, 29, 72, 0.2)",
        padding: "var(--space-8)",
        textAlign: "center"
      }}>
        <AlertCircle style={{ color: "#E11D48", width: "48px", height: "48px", marginBottom: "var(--space-4)" }} />
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "#9F1239", marginBottom: "var(--space-2)" }}>Failed to load</h3>
        <p style={{ color: "#BE123C" }}>{error}</p>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div style={{
        width: "100%",
        maxWidth: "420px",
        height: "480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        padding: "var(--space-8)",
        textAlign: "center"
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          background: "var(--bg-surface-hover)",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-6)",
          transform: "rotate(12deg)",
          border: "1px solid var(--border-subtle)"
        }}>
          <Sparkles style={{ color: "var(--brand-gold)", width: "32px", height: "32px" }} />
        </div>
        <h3 style={{ fontSize: "var(--text-2xl)", fontFamily: "var(--font-display)", color: "var(--text-heading)", marginBottom: "var(--space-3)", margin: 0 }}>You're all caught up!</h3>
        <p style={{ color: "var(--text-body)", lineHeight: "var(--leading-normal)", maxWidth: "250px", margin: 0 }}>
          You've reviewed all specific requirements. Head over to the Scholarships tab to see your updated matches!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: "var(--space-8)",
      paddingBottom: "var(--space-8)",
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        height: "480px"
      }}>
        <AnimatePresence mode="popLayout">
          {requirements.map((req, index) => {
            // Only render top 3 cards for depth effect
            if (index > 2) return null;

            return (
              <SwipeCard
                key={req.description + req.scholarshipTitle}
                req={req}
                index={index}
                total={requirements.length}
                onSwipe={handleSwipe}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: "var(--space-8)", textAlign: "center" }}>
        <p style={{
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} remaining
        </p>
      </div>
    </div>
  );
}
