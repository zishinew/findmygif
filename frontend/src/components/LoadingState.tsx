"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { id: "reading", label: "reading conversation…" },
  { id: "analyzing", label: "analyzing tone…" },
  { id: "searching", label: "finding gifs…" },
];

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setActiveStep(1), 1500),
      setTimeout(() => setActiveStep(2), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="loading" role="status">
      <div className="loading__spinner" />
      <div className="loading__steps">
        {STEPS.map((step, i) => {
          let cls = "loading__step";
          if (i < activeStep) cls += " loading__step--done";
          else if (i === activeStep) cls += " loading__step--active";
          return (
            <span key={step.id} className={cls}>
              {i < activeStep ? "✓ " : ""}
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
