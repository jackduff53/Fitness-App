"use client";

import { useState } from "react";

interface FoodEntryFormProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
  isOffline: boolean;
}

export function FoodEntryForm({ onSubmit, isLoading, isOffline }: FoodEntryFormProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isOffline ? "Offline — use manual entry below" : "Describe what you ate..."}
        className="flex-1 bg-card text-text-primary rounded-xl px-4 py-3 placeholder:text-text-secondary outline-none focus:ring-2 focus:ring-accent/50"
        disabled={isOffline || isLoading}
      />
      <button
        type="submit"
        disabled={!text.trim() || isLoading || isOffline}
        className="bg-accent text-background font-semibold px-5 py-3 rounded-xl disabled:opacity-40 transition-opacity"
      >
        {isLoading ? "..." : "Log"}
      </button>
    </form>
  );
}
