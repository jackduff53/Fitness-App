"use client";

import { useState, useEffect, useRef } from "react";
import { useGarminData } from "@/contexts/GarminDataContext";
import { db } from "@/db/database";
import type { DailySummary } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: garminData } = useGarminData();

  useEffect(() => {
    async function loadSummaries() {
      const all = await db.dailySummaries.toArray();
      setSummaries(all);
    }
    loadSummaries();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/fitness-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          activities: garminData?.workouts || [],
          dailySummaries: summaries,
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-bold mb-4">Fitness AI Chat</h1>
      <p className="text-xs text-text-secondary mb-4">Ask anything about your workouts and activity data</p>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-text-secondary text-sm space-y-2 bg-card rounded-xl p-4">
            <p>Try asking:</p>
            <p className="text-accent">&quot;How many calories did I burn this week?&quot;</p>
            <p className="text-accent">&quot;What was my longest workout?&quot;</p>
            <p className="text-accent">&quot;Am I on track for my goals?&quot;</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl p-3 max-w-[85%] ${
              msg.role === "user"
                ? "bg-accent text-black ml-auto"
                : "bg-card text-text-primary"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="bg-card rounded-xl p-3 max-w-[85%]">
            <p className="text-sm text-text-secondary animate-pulse">Thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your fitness data..."
          className="flex-1 bg-card text-text-primary rounded-xl px-4 py-3 placeholder:text-text-secondary outline-none focus:ring-2 focus:ring-accent/50"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-accent text-black font-semibold px-5 py-3 rounded-xl disabled:opacity-40 transition-opacity"
        >
          →
        </button>
      </form>
    </div>
  );
}
