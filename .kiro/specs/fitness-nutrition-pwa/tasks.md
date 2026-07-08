# Implementation Plan: Fitness & Nutrition PWA

## Overview

Build a Progressive Web App fitness and nutrition tracker using Next.js 14+ App Router, TypeScript, Tailwind CSS, Dexie.js for local-first persistence, Garmin Connect Web API for activity data, and OpenAI GPT-3.5-turbo for natural language food parsing. The app is deployed to Vercel and installable on Windows and iOS.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize Next.js 14+ project with TypeScript and Tailwind CSS
    - Run `npx create-next-app@latest` with App Router, TypeScript, and Tailwind CSS options
    - Install dependencies: `dexie`, `next-pwa`
    - Create `.env.local` template with `GARMIN_CONSUMER_KEY`, `GARMIN_CONSUMER_SECRET`, `OPENAI_API_KEY` placeholders
    - Create the directory structure: `src/services/`, `src/db/`, `src/types/`, `src/lib/`, `src/components/`, `src/contexts/`
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 1.2 Configure Tailwind CSS with custom theme tokens
    - Add custom colors to `tailwind.config.ts`: background (#0A0D1A), card (#141A29), accent (#33FFE0), text-primary (#FFFFFF), text-secondary (#9CA3AF)
    - Create `src/lib/theme.ts` exporting theme token constants for use in components
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 1.3 Configure next-pwa and create web app manifest
    - Set up `next.config.js` with `next-pwa` plugin (dest: "public", register: true, skipWaiting: true, disable in dev)
    - Create `public/manifest.json` with name, short_name, start_url, display: standalone, background_color, theme_color, and icon references
    - Create placeholder icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 2. Data models and database layer
  - [x] 2.1 Define TypeScript interfaces
    - Create `src/types/index.ts` with interfaces: FoodEntry, DailyGoals, Workout, DailySummary, GarminDailyData, ParsedFoodResult, HeartHealthInput, WorkoutRecommendation type, HeartHealthColor type
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 2.2 Implement Dexie.js database schema
    - Create `src/db/database.ts` with FitnessDatabase class extending Dexie
    - Define tables: foodEntries (++id, date, timestamp), dailyGoals (id), dailySummaries (++id, &date)
    - Export singleton `db` instance
    - _Requirements: 11.4_

  - [ ]* 2.3 Write property tests for data persistence round trips
    - **Property 1: Food entry persistence round trip** — save and read back a food entry, verify all fields match
    - **Property 2: Daily goals persistence round trip** — save and read back goals, verify all fields match
    - **Property 3: Daily summary persistence round trip** — save and read back a summary by date, verify all fields match
    - **Validates: Requirements 4.5, 5.2, 11.1, 11.2, 11.3**

- [x] 3. Pure calculation services
  - [x] 3.1 Implement nutritionCalculator service
    - Create `src/services/nutritionCalculator.ts`
    - Implement `aggregateDailyNutrition(entries: FoodEntry[])` that sums calories, protein, carbs, fat, fiber and collects unhealthy food names
    - _Requirements: 5.3, 6.2, 6.3_

  - [x] 3.2 Implement heartHealthCalculator service
    - Create `src/services/heartHealthCalculator.ts`
    - Implement `calculateHeartHealthScore(input: HeartHealthInput): number` following the algorithm: base 50 + fiber bonuses + cardio bonus + calorie bonus + fat bonus - unhealthy penalty, clamped [0, 100]
    - Implement `getScoreColor(score: number): HeartHealthColor` returning "green" (>=70), "yellow" (40-69), "red" (<40)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]* 3.3 Write property tests for heartHealthCalculator
    - **Property 5: Heart health score calculation correctness** — verify score computation matches the defined algorithm for any valid HeartHealthInput
    - **Property 6: Heart health score clamping invariant** — verify result is always in [0, 100]
    - **Property 7: Heart health score color mapping** — verify getScoreColor returns correct color for any score in [0, 100]
    - **Validates: Requirements 6.1–6.9**

  - [x] 3.4 Implement streakCalculator service
    - Create `src/services/streakCalculator.ts`
    - Implement `calculateBurnStreak(summaries: DailySummary[], burnGoal: number): number`
    - Implement `calculateIntakeStreak(summaries: DailySummary[], calorieTarget: number): number`
    - Sort summaries by date descending, count consecutive qualifying days from most recent
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 3.5 Write property tests for streakCalculator
    - **Property 8: Burn streak calculation** — verify streak equals consecutive qualifying days from most recent
    - **Property 9: Intake streak calculation** — verify streak equals consecutive qualifying days from most recent
    - **Validates: Requirements 8.1, 8.2**

  - [x] 3.6 Implement workoutRecommendation service
    - Create `src/services/workoutRecommendation.ts`
    - Implement `getWorkoutRecommendation(caloriesBurned: number, burnGoal: number): WorkoutRecommendation`
    - Return "cardio" if caloriesBurned < burnGoal, else "recovery"
    - _Requirements: 3.1, 3.2_

  - [ ]* 3.7 Write property test for workoutRecommendation
    - **Property 4: Workout recommendation correctness** — verify "cardio" iff caloriesBurned < burnGoal, "recovery" otherwise
    - **Validates: Requirements 3.1, 3.2**

- [x] 4. Checkpoint - Core services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. API routes
  - [ ] 5.1 Implement Garmin OAuth auth route
    - Create `src/app/api/garmin/auth/route.ts`
    - Implement OAuth 1.0a initiation flow using `GARMIN_CONSUMER_KEY` and `GARMIN_CONSUMER_SECRET`
    - Handle callback to store access token in secure HTTP-only cookie
    - Return redirect URL on initiation, handle token exchange on callback
    - _Requirements: 1.3, 1.4, 14.5_

  - [ ] 5.2 Implement Garmin data fetch route
    - Create `src/app/api/garmin/data/route.ts`
    - Implement GET handler that uses stored OAuth token to fetch daily steps, active calories, workouts, and resting heart rate from Garmin Connect API
    - Return typed `GarminDailyData` JSON response
    - Return 401 on auth errors, 500 on network errors
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [ ] 5.3 Implement food parse route
    - Create `src/app/api/food-parse/route.ts`
    - Implement POST handler that sends food description to OpenAI GPT-3.5-turbo with structured system prompt
    - Parse response into `ParsedFoodResult` JSON
    - Use `OPENAI_API_KEY` from environment variables
    - Handle API errors with appropriate status codes
    - _Requirements: 4.2, 4.7, 14.4_

- [ ] 6. Client service wrappers
  - [ ] 6.1 Implement garminService client wrapper
    - Create `src/services/garminService.ts`
    - Implement `fetchGarminData(): Promise<GarminDailyData>` calling GET /api/garmin/data
    - Implement `initiateGarminAuth(): Promise<string>` calling POST /api/garmin/auth
    - Handle error responses and type return values
    - _Requirements: 1.1, 1.2_

  - [ ] 6.2 Implement openaiService client wrapper
    - Create `src/services/openaiService.ts`
    - Implement `parseFoodDescription(description: string): Promise<ParsedFoodResult>` calling POST /api/food-parse
    - Throw on network or API errors for caller to handle
    - _Requirements: 4.2_

- [ ] 7. State management contexts
  - [ ] 7.1 Implement GarminDataContext
    - Create `src/contexts/GarminDataContext.tsx`
    - Define state: data (GarminDailyData | null), isLoading, error ("auth" | "network" | null), lastFetched, refresh function
    - Fetch on mount via garminService, expose manual refresh
    - Handle 401 → set error "auth", network errors → set error "network" and retain last data
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [ ] 7.2 Implement GoalsContext
    - Create `src/contexts/GoalsContext.tsx`
    - Define state: goals (DailyGoals | null), isLoading, updateGoals function
    - Load goals from Dexie on mount, write to IndexedDB on save
    - _Requirements: 5.2, 5.4, 11.6_

- [ ] 8. UI components
  - [ ] 8.1 Implement ProgressRing component
    - Create `src/components/ProgressRing.tsx`
    - SVG circular progress indicator with accent color fill arc
    - Props: current, goal, label, unit, size
    - Calculate percentage as Math.min(current / goal, 1) * 100
    - _Requirements: 2.2, 2.3_

  - [ ]* 8.2 Write property test for ProgressRing ratio calculation
    - **Property 10: Macro progress bar ratio** — verify fill percentage equals Math.min(current / target, 1) * 100 for any non-negative current and positive target
    - **Validates: Requirements 5.3**

  - [ ] 8.3 Implement SparklineChart component
    - Create `src/components/SparklineChart.tsx`
    - SVG polyline chart, no axes or labels, evenly spaced points
    - Props: data (number[]), label, height, color
    - Handle 1-7 data points
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 13.2_

  - [ ] 8.4 Implement MetricCard component
    - Create `src/components/MetricCard.tsx`
    - Card wrapper with bg-card (#141A29), rounded corners, padding, white text
    - Props: title, value, subtitle, children
    - _Requirements: 2.4, 10.2_

  - [ ] 8.5 Implement NavigationBar component
    - Create `src/components/NavigationBar.tsx`
    - Fixed bottom bar with 3 tabs: Dashboard, Food Log, Goals/Settings
    - Use `usePathname()` for active tab detection, apply accent color to active item
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 8.6 Implement WorkoutCard component
    - Create `src/components/WorkoutCard.tsx`
    - Display workout type, duration in minutes, calories burned
    - Handle empty state message when no workouts
    - _Requirements: 2.5, 2.6_

  - [ ] 8.7 Implement FoodEntryForm and FoodReviewCard components
    - Create `src/components/FoodEntryForm.tsx` — text input with submit button, manual entry fallback when offline
    - Create `src/components/FoodReviewCard.tsx` — displays parsed food data with editable fields, confirm/cancel actions
    - _Requirements: 4.1, 4.3, 4.4, 4.6_

  - [ ] 8.8 Implement GoalInput and MacroProgressBar components
    - Create `src/components/GoalInput.tsx` — input fields for daily targets (calories, protein, carbs, fat, burn goal)
    - Create `src/components/MacroProgressBar.tsx` — horizontal progress bar showing current/target with percentage fill
    - _Requirements: 5.1, 5.3_

  - [ ] 8.9 Implement HeartHealthCard component
    - Create `src/components/HeartHealthCard.tsx`
    - Display score with color coding (green/yellow/red), list unhealthy food names
    - _Requirements: 6.9, 6.10_

  - [ ] 8.10 Implement StreakCounter and WorkoutRecommendation components
    - Create `src/components/StreakCounter.tsx` — display burn streak and intake streak as numeric values
    - Create `src/components/WorkoutRecommendation.tsx` — display cardio or recovery recommendation
    - _Requirements: 8.4, 3.1, 3.2_

  - [ ] 8.11 Implement OfflineIndicator component
    - Create `src/components/OfflineIndicator.tsx`
    - Use `navigator.onLine` and online/offline events to show/hide indicator
    - Indicate that Garmin sync and food parsing are unavailable when offline
    - _Requirements: 11.7_

- [ ] 9. Checkpoint - Components complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Pages and layout
  - [ ] 10.1 Implement root layout with providers and navigation
    - Create `src/app/layout.tsx` with GarminDataContext and GoalsContext providers
    - Include NavigationBar in layout
    - Set global dark background color (#0A0D1A) and font styling
    - Add PWA meta tags and manifest link
    - _Requirements: 9.4, 10.1, 10.6, 12.2_

  - [ ] 10.2 Implement Dashboard page
    - Create `src/app/page.tsx` as the Dashboard
    - Compose components in order: Calories Burned ProgressRing, WorkoutRecommendation, Calories Consumed ProgressRing, Step Count MetricCard, Resting Heart Rate MetricCard with SparklineChart, Today's Workout Stats (WorkoutCard list), HeartHealthCard, Weekly Trends (3 sparklines), StreakCounter
    - Wire up GarminDataContext data, GoalsContext goals, compute heart health score via heartHealthCalculator, compute streaks via streakCalculator, aggregate nutrition via nutritionCalculator
    - Add manual refresh button calling garminData.refresh()
    - Handle auth error → show re-auth prompt, network error → show error message with cached data
    - Handle missing heart rate → show placeholder
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 6.9, 6.10, 7.1, 7.2, 7.3, 7.4, 7.5, 8.4, 13.1, 13.2, 13.3, 13.4_

  - [ ] 10.3 Implement Food Log page
    - Create `src/app/food-log/page.tsx`
    - Include FoodEntryForm, handle submission flow: call openaiService → show FoodReviewCard → on confirm save to Dexie
    - Display today's food entries list from IndexedDB
    - Handle offline: show manual entry form directly
    - Handle OpenAI errors: fall back to manual entry form
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 10.4 Implement Goals/Settings page
    - Create `src/app/goals/page.tsx`
    - Include GoalInput for setting daily targets (calories, protein, carbs, fat, burn goal)
    - Include MacroProgressBar components for each macro showing current vs target
    - Wire up GoalsContext for loading and saving goals
    - Allow goal modification offline
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 11.6_

- [ ] 11. Integration and wiring
  - [ ] 11.1 Wire daily summary persistence
    - After Garmin data refresh, upsert DailySummary for today in IndexedDB (date, totalCaloriesBurned, stepCount, restingHeartRate, workouts)
    - On food entry confirm, update totalCaloriesConsumed in today's DailySummary
    - Source sparkline data from last 7 daily summaries + current-day live data
    - _Requirements: 7.4, 11.3_

  - [ ] 11.2 Wire offline detection and fallback behaviors
    - Integrate OfflineIndicator into layout
    - Disable Garmin refresh button and food parse submit when offline
    - Ensure food log and goals pages read from IndexedDB when offline
    - _Requirements: 11.5, 11.6, 11.7, 12.5_

  - [ ] 11.3 Wire Garmin auth error and re-authentication flow
    - When GarminDataContext reports "auth" error, show re-auth prompt on Dashboard
    - Clicking prompt calls initiateGarminAuth() and redirects user
    - _Requirements: 1.5_

- [ ] 12. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The tech stack is Next.js 14+ App Router, TypeScript, Tailwind CSS, Dexie.js, next-pwa, deployed to Vercel
- All API keys are server-side environment variables, never exposed to the client

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1", "3.2", "3.4", "3.6"] },
    { "id": 4, "tasks": ["3.3", "3.5", "3.7", "5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["7.1", "7.2"] },
    { "id": 7, "tasks": ["8.1", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9", "8.10", "8.11"] },
    { "id": 8, "tasks": ["8.2"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3", "10.4"] },
    { "id": 11, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
