"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dashboard", href: "/", icon: "📊" },
  { label: "Food Log", href: "/food-log", icon: "🍽️" },
  { label: "Goals", href: "/goals", icon: "🎯" },
];

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors ${
                isActive ? "text-accent" : "text-text-secondary"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
