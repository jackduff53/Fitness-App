# Design Document

## Overview

A Progressive Web App fitness and nutrition tracker built with Next.js 14+ App Router, TypeScript, and Tailwind CSS. The application integrates Garmin Connect Health API (OAuth 1.0a) for activity data, OpenAI GPT-3.5-turbo for natural language food parsing, and Dexie.js for local-first IndexedDB persistence. It is deployed to Vercel free tier and installable as a PWA on Windows and iOS.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser/PWA)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js App Router (Pages)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Dashboard │  │ Food Log │  │ Goals/Settings   │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services Layer (Client)                             │   │
│  │  nutritionCalculator | heartHealthCalculator         │   │
│  │  streakCalculator                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dexie.js (IndexedDB)                                │   │
│  │  foodEntries | dailyGoals | dailySummaries           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Service Worker (next-pwa)                           │   │
│  │  App shell cache | offline fallback                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes (Server)                 │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │/api/garmin/  │  │/api/garmin/data  │  │/api/food-    │   │
│  │  auth        │  │                  │  │  parse       │   │
│  └──────────────┘  └─────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
┌──────────────────────┐        ┌──────────────────────┐
│ Garmin Connect API   │        │ OpenAI API           │
│ (OAuth 1.0a)         │        │ (GPT-3.5-turbo)      │
└──────────────────────┘        └──────────────────────┘
```

### Architectural Principles

- **Local-first**: All user data lives in IndexedDB. Network calls enrich but are not required for core viewing.
- **Server-side secrets**: API keys and OAuth credentials never reach the client bundle.
- **Offline-capable**: Service worker caches the app shell; Dexie.js provides data access offline.
- **Single-user**: No authentication layer on the app itself; Garmin OAuth grants access to one user's data.

## File Structure

```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with NavigationBar, global providers
│   │   ├── page.tsx                # Dashboard (/)
│   │   ├── food-log/
│   │   │   └── page.tsx            # Food Log (/food-log)
│   │   ├── goals/
│   │   │   └── page.tsx            # Goals/Settings (/goals)
│   │   └── api/
│   │       ├── garmin/
│   │       │   ├── auth/
│   │       │   │   └── route.ts    # OAuth 1.0a initiation & callback
│   │       │   └── data/
│   │       │       └── route.ts    # Fetch daily Garmin data
│   │       └── food-parse/
│   │           └── route.ts        # OpenAI food parsing
│   ├── components/
│   │   ├── NavigationBar.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── MetricCard.tsx
│   │   ├── SparklineChart.tsx
│   │   ├── WorkoutCard.tsx
│   │   ├── FoodEntryForm.tsx
│   │   ├── FoodReviewCard.tsx
│   │   ├── GoalInput.tsx
│   │   ├── MacroProgressBar.tsx
│   │   ├── HeartHealthCard.tsx
│   │   ├── StreakCounter.tsx
│   │   ├── WorkoutRecommendation.tsx
│   │   └── OfflineIndicator.tsx
│   ├── services/
│   │   ├── garminService.ts        # Client-side fetch wrapper for /api/garmin/*
│   │   ├── openaiService.ts        # Client-side fetch wrapper for /api/food-parse
│   │   ├── nutritionCalculator.ts  # Aggregate daily macros from food entries
│   │   ├── heartHealthCalculator.ts# Heart health score computation
│   │   └── streakCalculator.ts     # Streak computation from daily summaries
│   ├── db/
│   │   └── database.ts             # Dexie.js schema and instance
│   ├── types/
│   │   └── index.ts                # Shared TypeScript interfaces
│   └── lib/
│       └── theme.ts                # Tailwind theme token constants
├── public/
│   ├── manifest.json               # PWA web app manifest
│   ├── icons/                      # PWA icons (192x192, 512x512)
│   └── sw.js                       # Generated service worker (next-pwa output)
├── next.config.js                  # Next.js config with next-pwa plugin
├── tailwind.config.ts              # Tailwind config with custom theme tokens
├── tsconfig.json
├── package.json
└── .env.local                      # Environment variables (not committed)
```

## Data Models

### TypeScript Interfaces

```typescript
// src/types/index.ts

export interface FoodEntry {
  id?: number;               // Auto-incremented by Dexie
  name: string;
  calories: number;
  protein: number;           // grams
  carbs: number;             // grams
  fat: number;               // grams
  fiber: number;             // grams
  heartUnhealthy: boolean;
  heartUnhealthyReason?: string;
  timestamp: number;         // Unix timestamp (ms)
  date: string;              // ISO date string "YYYY-MM-DD" for indexing
}

export interface DailyGoals {
  id?: number;               // Single row, id = 1
  calorieTarget: number;
  proteinTarget: number;     // grams
  carbsTarget: number;       // grams
  fatTarget: number;         // grams
  burnGoal: number;          // calories
}

export interface Workout {
  type: string;              // e.g., "Running", "Cycling", "Strength"
  durationMinutes: number;
  caloriesBurned: number;
}

export interface DailySummary {
  id?: number;
  date: string;              // ISO date string "YYYY-MM-DD" (unique index)
  totalCaloriesConsumed: number;
  totalCaloriesBurned: number;
  stepCount: number;
  restingHeartRate: number | null;
  workouts: Workout[];
}

export interface GarminDailyData {
  steps: number;
  activeCaloriesBurned: number;
  workouts: Workout[];
  restingHeartRate: number | null;
}

export interface ParsedFoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  heartUnhealthy: boolean;
  heartUnhealthyReason?: string;
}

export interface HeartHealthInput {
  dailyFiber: number;
  hasCardioWorkout: boolean;
  caloriesConsumed: number;
  calorieTarget: number;
  fatConsumed: number;
  fatTarget: number;
  unhealthyFoodCount: number;
}

export type WorkoutRecommendation = "cardio" | "recovery";

export type HeartHealthColor = "green" | "yellow" | "red";
```

### Dexie.js Database Schema

```typescript
// src/db/database.ts
import Dexie, { type Table } from "dexie";
import type { FoodEntry, DailyGoals, DailySummary } from "@/types";

export class FitnessDatabase extends Dexie {
  foodEntries!: Table<FoodEntry, number>;
  dailyGoals!: Table<DailyGoals, number>;
  dailySummaries!: Table<DailySummary, number>;

  constructor() {
    super("FitnessNutritionDB");
    this.version(1).stores({
      foodEntries: "++id, date, timestamp",
      dailyGoals: "id",
      dailySummaries: "++id, &date",
    });
  }
}

export const db = new FitnessDatabase();
```

## Component Interfaces

### ProgressRing

```typescript
interface ProgressRingProps {
  current: number;
  goal: number;
  label: string;         // e.g., "Calories Burned", "Calories Consumed"
  unit?: string;         // e.g., "cal"
  size?: number;         // diameter in pixels, default 160
}
```

Renders an SVG circular progress indicator. Percentage = `Math.min(current / goal, 1) * 100`. Accent color (#33FFE0) for the filled arc, dark gray for background arc.

### SparklineChart

```typescript
interface SparklineChartProps {
  data: number[];        // Array of values (up to 7 days)
  label: string;
  height?: number;       // default 40px
  color?: string;        // default accent cyan
}
```

Renders an inline SVG polyline chart. No axes, no labels on chart itself. Points are evenly distributed across available width. Handles 1-7 data points gracefully.

### MetricCard

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  children?: React.ReactNode;  // For embedding sparkline or additional content
}
```

Card wrapper using `bg-[#141A29]` with rounded corners, padding, and white text.

### NavigationBar

```typescript
interface NavTab {
  label: string;
  href: string;
  icon: React.ReactNode;
}
```

Fixed bottom bar with three tabs. Uses `usePathname()` to determine active tab and applies `text-[#33FFE0]` to the active item.

### FoodEntryForm

```typescript
interface FoodEntryFormProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
  isOffline: boolean;
}
```

Text input with submit button. When offline, shows manual entry fields directly.

### FoodReviewCard

```typescript
interface FoodReviewCardProps {
  parsedResult: ParsedFoodResult;
  onConfirm: (entry: ParsedFoodResult) => void;
  onCancel: () => void;
}
```

Displays parsed food data with editable fields. User can modify any field before confirming.

### MacroProgressBar

```typescript
interface MacroProgressBarProps {
  label: string;          // "Protein", "Carbs", "Fat"
  current: number;
  target: number;
  unit?: string;          // default "g"
}
```

Horizontal progress bar showing `current / target` with percentage fill.

### HeartHealthCard

```typescript
interface HeartHealthCardProps {
  score: number;
  color: HeartHealthColor;
  unhealthyFoods: string[];   // Names of flagged foods
}
```

### StreakCounter

```typescript
interface StreakCounterProps {
  burnStreak: number;
  intakeStreak: number;
}
```

### WorkoutRecommendation

```typescript
interface WorkoutRecommendationProps {
  recommendation: WorkoutRecommendation;
}
```

## Services

### heartHealthCalculator

```typescript
// src/services/heartHealthCalculator.ts

export function calculateHeartHealthScore(input: HeartHealthInput): number;
export function getScoreColor(score: number): HeartHealthColor;
```

**Algorithm:**
1. Start at base score 50
2. If `dailyFiber >= 25`: add 10 points
3. If `dailyFiber > 10`: add `Math.min(Math.floor((dailyFiber - 10) / 5) * 5, 15)` points
4. If `hasCardioWorkout`: add 15 points
5. If `caloriesConsumed <= calorieTarget`: add 10 points
6. If `fatConsumed <= fatTarget`: add 10 points
7. Subtract `unhealthyFoodCount * 10` points
8. Clamp result to [0, 100]

**Color mapping:**
- `score >= 70` → "green"
- `score >= 40` → "yellow"
- `score < 40` → "red"

### streakCalculator

```typescript
// src/services/streakCalculator.ts

export function calculateBurnStreak(
  summaries: DailySummary[],
  burnGoal: number
): number;

export function calculateIntakeStreak(
  summaries: DailySummary[],
  calorieTarget: number
): number;
```

**Algorithm:**
1. Sort summaries by date descending
2. Starting from the most recent qualifying day, count consecutive days that meet the criterion
3. If the most recent day does not qualify, streak is 0
4. Return the count

### nutritionCalculator

```typescript
// src/services/nutritionCalculator.ts

export function aggregateDailyNutrition(entries: FoodEntry[]): {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  unhealthyFoodCount: number;
  unhealthyFoodNames: string[];
};
```

Sums all food entries for a given date. Pure function operating on an array of `FoodEntry` objects.

### workoutRecommendation

```typescript
// src/services/workoutRecommendation.ts

export function getWorkoutRecommendation(
  caloriesBurned: number,
  burnGoal: number
): WorkoutRecommendation;
```

Returns `"cardio"` if `caloriesBurned < burnGoal`, otherwise `"recovery"`.

### garminService (Client)

```typescript
// src/services/garminService.ts

export async function fetchGarminData(): Promise<GarminDailyData>;
export async function initiateGarminAuth(): Promise<string>; // returns auth URL
```

Client-side wrappers that call the Next.js API routes. Handles error responses and returns typed data.

### openaiService (Client)

```typescript
// src/services/openaiService.ts

export async function parseFoodDescription(
  description: string
): Promise<ParsedFoodResult>;
```

Posts to `/api/food-parse` and returns parsed result. Throws on network or API errors.

## API Routes

### POST /api/garmin/auth

Initiates OAuth 1.0a flow with Garmin Connect. Returns redirect URL for user authorization. On callback, stores access token in a secure HTTP-only cookie or server session.

**Environment variables:**
- `GARMIN_CONSUMER_KEY`
- `GARMIN_CONSUMER_SECRET`

### GET /api/garmin/data

Fetches daily data from Garmin Connect Health API using stored OAuth tokens. Returns `GarminDailyData` JSON.

**Response:**
```json
{
  "steps": 8500,
  "activeCaloriesBurned": 450,
  "workouts": [
    { "type": "Running", "durationMinutes": 30, "caloriesBurned": 320 }
  ],
  "restingHeartRate": 62
}
```

**Error responses:**
- `401`: OAuth token expired/invalid → client shows re-auth prompt
- `500`: Network/server error → client shows error message, retains cached data

### POST /api/food-parse

Sends food description to OpenAI GPT-3.5-turbo with a structured system prompt requesting JSON output.

**Request body:**
```json
{ "description": "grilled chicken breast with brown rice and broccoli" }
```

**Response:**
```json
{
  "name": "Grilled Chicken with Brown Rice and Broccoli",
  "calories": 520,
  "protein": 45,
  "carbs": 55,
  "fat": 12,
  "fiber": 6,
  "heartUnhealthy": false,
  "heartUnhealthyReason": null
}
```

**Environment variables:**
- `OPENAI_API_KEY`

**System prompt structure:**
```
You are a nutrition assistant. Parse the following food description into structured JSON.
Return: { name, calories, protein (g), carbs (g), fat (g), fiber (g), heartUnhealthy (boolean), heartUnhealthyReason (string or null) }.
heartUnhealthy should be true for foods high in saturated fat, trans fat, or sodium (e.g., fried foods, processed meats, sugary drinks).
```

## State Management

Client-side state is managed via React Context with two providers:

### GarminDataContext

```typescript
interface GarminDataState {
  data: GarminDailyData | null;
  isLoading: boolean;
  error: "auth" | "network" | null;
  lastFetched: number | null;
  refresh: () => Promise<void>;
}
```

Fetches on mount and exposes a manual refresh function. Persists last successful fetch to survive network failures.

### GoalsContext

```typescript
interface GoalsState {
  goals: DailyGoals | null;
  isLoading: boolean;
  updateGoals: (goals: Partial<DailyGoals>) => Promise<void>;
}
```

Loads goals from Dexie on mount. Writes directly to IndexedDB on save.

## PWA Configuration

### Web App Manifest (public/manifest.json)

```json
{
  "name": "Fitness & Nutrition Tracker",
  "short_name": "FitTrack",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0D1A",
  "theme_color": "#33FFE0",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### next-pwa Configuration

```javascript
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // Next.js config
});
```

## Tailwind Theme Tokens

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        background: "#0A0D1A",
        card: "#141A29",
        accent: "#33FFE0",
        "text-primary": "#FFFFFF",
        "text-secondary": "#9CA3AF",
      },
    },
  },
};
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Garmin auth error (401) | Show re-authentication prompt, retain cached data |
| Garmin network error | Show connection error message, display last cached data |
| OpenAI API error | Show manual entry form as fallback |
| OpenAI network error | Show manual entry form as fallback |
| No Garmin data yet | Show placeholder "Connect Garmin" state |
| Offline state | Show offline indicator; disable sync/parse buttons; allow viewing/editing local data |
| No food entries for today | Show empty state in food log |
| No workouts for today | Show empty state message |
| Missing heart rate data | Show "Data unavailable" placeholder |

## Offline Strategy

1. **Service Worker** (via next-pwa): Caches app shell assets (HTML, CSS, JS, icons) using a cache-first strategy.
2. **Data layer** (Dexie.js): All food entries, goals, and daily summaries are persisted locally. The app reads from IndexedDB first, then enriches with live Garmin data when online.
3. **Online detection**: Use `navigator.onLine` and the `online`/`offline` events to toggle the `OfflineIndicator` component and disable network-dependent features.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Food entry persistence round trip

*For any* valid food entry with arbitrary name, calories, protein, carbs, fat, fiber, heartUnhealthy flag, reason, and timestamp values, saving it to the IndexedDB store and then reading it back by ID SHALL produce an entry with all fields identical to the original.

**Validates: Requirements 4.5, 11.1**

### Property 2: Daily goals persistence round trip

*For any* valid daily goals object with arbitrary calorieTarget, proteinTarget, carbsTarget, fatTarget, and burnGoal values, saving it to the IndexedDB store and then reading it back SHALL produce a goals object with all fields identical to the original.

**Validates: Requirements 5.2, 11.2**

### Property 3: Daily summary persistence round trip

*For any* valid daily summary with arbitrary date, totalCaloriesConsumed, totalCaloriesBurned, stepCount, restingHeartRate, and workout list values, saving it to the IndexedDB store and then reading it back by date SHALL produce a summary with all fields identical to the original.

**Validates: Requirements 11.3**

### Property 4: Workout recommendation correctness

*For any* pair of non-negative numbers (caloriesBurned, burnGoal), the workout recommendation function SHALL return "cardio" if and only if caloriesBurned < burnGoal, and "recovery" if and only if caloriesBurned >= burnGoal.

**Validates: Requirements 3.1, 3.2**

### Property 5: Heart health score calculation correctness

*For any* valid HeartHealthInput (non-negative dailyFiber, boolean hasCardioWorkout, non-negative caloriesConsumed and calorieTarget, non-negative fatConsumed and fatTarget, non-negative unhealthyFoodCount), the calculateHeartHealthScore function SHALL produce a result equal to: clamp(50 + fiberBonus25(dailyFiber) + fiberBonusGraduated(dailyFiber) + cardioBonus(hasCardioWorkout) + calorieBonus(caloriesConsumed, calorieTarget) + fatBonus(fatConsumed, fatTarget) - unhealthyFoodCount * 10, 0, 100) where each bonus follows the specified rules.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8**

### Property 6: Heart health score clamping invariant

*For any* valid HeartHealthInput regardless of extreme values, the calculateHeartHealthScore function SHALL always return a value in the range [0, 100] inclusive.

**Validates: Requirements 6.8**

### Property 7: Heart health score color mapping

*For any* integer score in the range [0, 100], the getScoreColor function SHALL return "green" if score >= 70, "yellow" if 40 <= score < 70, and "red" if score < 40.

**Validates: Requirements 6.9**

### Property 8: Burn streak calculation

*For any* sequence of daily summaries sorted by date and any positive burnGoal, the calculateBurnStreak function SHALL return the count of consecutive days (ending with the most recent qualifying day) where totalCaloriesBurned >= burnGoal. If the most recent day does not qualify, the streak SHALL be 0.

**Validates: Requirements 8.1**

### Property 9: Intake streak calculation

*For any* sequence of daily summaries sorted by date and any positive calorieTarget, the calculateIntakeStreak function SHALL return the count of consecutive days (ending with the most recent qualifying day) where totalCaloriesConsumed <= calorieTarget. If the most recent day does not qualify, the streak SHALL be 0.

**Validates: Requirements 8.2**

### Property 10: Macro progress bar ratio

*For any* non-negative current intake value and positive target value, the progress bar fill percentage SHALL equal Math.min(current / target, 1) * 100, correctly representing the ratio capped at 100%.

**Validates: Requirements 5.3**
