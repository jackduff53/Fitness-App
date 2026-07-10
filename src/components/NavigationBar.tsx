"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/", icon: "◉" },
  { label: "Food", href: "/food-log", icon: "◎" },
  { label: "Plan", href: "/schedule", icon: "▣" },
  { label: "Workout", href: "/workout", icon: "◆" },
  { label: "AI", href: "/chat", icon: "◈" },
  { label: "Goals", href: "/goals", icon: "◇" },
];

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/5 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 ${
                isActive
                  ? "text-accent scale-110"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
