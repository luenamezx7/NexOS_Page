"use client";

import { ThinkingOrb, type OrbState } from "thinking-orbs";
import styles from "./ThinkingOrbWrapper.module.css";

interface OrbProps {
  state?: OrbState;
  size?: number;
  label?: string;
}

export function ThinkingOrbWrapper({ 
  state = "searching", 
  size = 64, 
  label 
}: OrbProps) {
  return (
    <div className={styles.container} aria-live="polite">
      <ThinkingOrb 
        state={state} 
        size={size as 20 | 64} 
        theme="dark" 
      />

      {label && (
        <span className={styles.label}>
          {label}
        </span>
      )}
    </div>
  );
}