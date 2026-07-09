import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavigationBar } from "@/components/NavigationBar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { GarminDataProvider } from "@/contexts/GarminDataContext";

export const metadata: Metadata = {
  title: "Fitness & Nutrition Tracker",
  description: "Track your fitness and nutrition with AI-powered food logging",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitTrack",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary min-h-screen pb-20">
        <GarminDataProvider>
          <GoalsProvider>
            <OfflineIndicator />
            <main className="max-w-lg mx-auto px-4 py-6">
              {children}
            </main>
            <NavigationBar />
          </GoalsProvider>
        </GarminDataProvider>
      </body>
    </html>
  );
}
