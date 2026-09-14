"use client";

import { useState, useEffect } from "react";
import { ThinkingOrbWrapper } from "@/components/ThinkingOrbWrapper";

export function HomeScreen() {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white select-none">
        <ThinkingOrbWrapper state="searching" size={64} label="INITIALIZING NEXOS..." />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        NexOS Platform
      </h1>
    </main>
  );
}