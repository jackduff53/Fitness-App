# Requirements Document

## Introduction

A Progressive Web App (PWA) fitness and nutrition tracker built with Next.js, TypeScript, and Tailwind CSS. The application integrates with Garmin Connect Web API for activity data and OpenAI GPT-3.5-turbo for natural language food logging. It provides a single-user personal dashboard displaying calories burned vs goal, calories consumed vs goal, step count, resting heart rate, workout stats, heart health score, weekly trends, and streak counters. Data persists locally via IndexedDB (Dexie.js) with offline support for viewing and goal-setting. The app is installable on Windows (Edge/Chrome) and iPhone (Safari).

## Glossary

- **PWA**: Progressive Web App — a web application that uses service workers, web manifests, and modern web capabilities to deliver an installable, offline-capable experience
- **Dashboard**: The home screen of the application displaying all fitness and nutrition summary cards
- **Garmin_API**: The Garmin Connect Health API accessed via OAuth 1.0a to retrieve activity and health data
- **OpenAI_API**: The OpenAI GPT-3.5-turbo chat completions endpoint used to parse natural language food descriptions into structured nutrition data
- **IndexedDB_Store**: The local IndexedDB database accessed via Dexie.js that stores food entries, daily goals, and daily summaries
- **Food_Logger**: The component responsible for accepting natural language food input, sending it to OpenAI_API, and presenting parsed results for user review
- **Goals_Manager**: The component responsible for managing daily nutrition and activity targets
- **Heart_Score_Engine**: The local rule-based computation engine that calculates a heart health score from 0-100
- **Streak_Calculator**: The component that computes consecutive days meeting burn goal and intake target from historical daily summaries
- **Navigation_Bar**: The bottom tab-based navigation component with Dashboard, Food Log, and Goals/Settings tabs
- **Service_Worker**: The background script that enables offline caching of the app shell and PWA installability
- **Progress_Ring**: A circular progress indicator displaying current value vs target
- **Sparkline**: A small inline 7-day trend chart without axes

## Requirements

### Requirement 1: Garmin Connect Web API Integration

**User Story:** As a user, I want my daily activity data automatically pulled from Garmin Connect, so that I can see my steps, calories burned, workouts, and resting heart rate without manual entry.

#### Acceptance Criteria

1. WHEN the application opens, THE Garmin_API SHALL retrieve daily steps, active energy burned in calories, workout list (type, duration, calories per workout), and resting heart rate for the current day.
2. WHEN the user presses the manual refresh button, THE Garmin_API SHALL retrieve the latest daily steps, active energy burned in calories, workout list (type, duration, calories per workout), and resting heart rate for the current day.
3. THE Garmin_API SHALL authenticate using OAuth 1.0a flow handled through Next.js API routes.
4. THE Garmin_API SHALL store OAuth credentials (consumer key, consumer secret, access token, token secret) as server-side environment variables.
5. IF the Garmin_API returns an authentication error, THEN THE Dashboard SHALL display a re-authentication prompt to the user.
6. IF the Garmin_API returns a network error, THEN THE Dashboard SHALL display a connection error message and retain the last successfully fetched data.

### Requirement 2: Home Dashboard Layout

**User Story:** As a user, I want a single dashboard screen showing all my fitness and nutrition metrics at a glance, so that I can quickly assess my daily progress.

#### Acceptance Criteria

1. THE Dashboard SHALL display components in the following top-to-bottom order: Calories Burned vs Goal progress ring, Recommended Workout of the Day, Calories Consumed vs Goal progress ring, Step Count card, Resting Heart Rate card with 7-day sparkline, Today's Workout Stats list, Heart Health Score card, Weekly Trends section, Streak Counters.
2. THE Dashboard SHALL display a Progress_Ring for calories burned showing current burned calories and the daily burn goal.
3. THE Dashboard SHALL display a Progress_Ring for calories consumed showing current consumed calories and the daily intake goal.
4. THE Dashboard SHALL display the daily step count as a numeric value on a dedicated card.
5. WHEN no workouts exist for the current day, THE Dashboard SHALL display an empty state message in the Today's Workout Stats section.
6. WHEN one or more workouts exist for the current day, THE Dashboard SHALL display each workout with type, duration in minutes, and calories burned.

### Requirement 3: Recommended Workout of the Day

**User Story:** As a user, I want a daily workout recommendation based on my progress toward my burn goal, so that I know what type of exercise to prioritize.

#### Acceptance Criteria

1. WHILE the user's calories burned for the current day is less than the daily burn goal, THE Dashboard SHALL recommend a cardio workout.
2. WHILE the user's calories burned for the current day is greater than or equal to the daily burn goal, THE Dashboard SHALL recommend a recovery or strength workout.

### Requirement 4: Natural Language Food Logging

**User Story:** As a user, I want to log food by typing what I ate in plain English, so that I can track my nutrition without manually looking up calorie and macro data.

#### Acceptance Criteria

1. THE Food_Logger SHALL provide a text input field where the user can type a food description in natural language.
2. WHEN the user submits a food description, THE Food_Logger SHALL send the text to the OpenAI_API and request a JSON response containing: name, calories, protein in grams, carbs in grams, fat in grams, fiber in grams, heartUnhealthy boolean flag, and heartUnhealthy reason.
3. WHEN the OpenAI_API returns a parsed result, THE Food_Logger SHALL display the parsed nutrition data for user review before saving.
4. WHILE the parsed result is displayed for review, THE Food_Logger SHALL allow the user to edit any field (name, calories, protein, carbs, fat, fiber, heartUnhealthy flag, reason) before confirming.
5. WHEN the user confirms the parsed result, THE Food_Logger SHALL save the food entry to IndexedDB_Store.
6. IF the OpenAI_API returns an error or is unreachable, THEN THE Food_Logger SHALL display a manual entry form with fields for name, calories, protein, carbs, fat, fiber, and heartUnhealthy flag.
7. THE Food_Logger SHALL use the OpenAI API key stored as a server-side environment variable.

### Requirement 5: Eating Goals Tracker

**User Story:** As a user, I want to set daily nutrition and activity targets and see my progress toward them, so that I can stay on track with my health goals.

#### Acceptance Criteria

1. THE Goals_Manager SHALL provide input fields for daily targets: calories consumed, protein in grams, carbs in grams, fat in grams, and calories burned goal.
2. WHEN the user saves goal values, THE Goals_Manager SHALL persist the goals to IndexedDB_Store.
3. THE Goals_Manager SHALL display progress bars for each macro (protein, carbs, fat) showing current intake vs daily target on the Goals page.
4. WHEN the application loads, THE Goals_Manager SHALL retrieve saved goals from IndexedDB_Store.

### Requirement 6: Heart Health Score

**User Story:** As a user, I want a daily heart health score computed from my nutrition and activity, so that I can understand how my daily choices affect my cardiovascular health.

#### Acceptance Criteria

1. THE Heart_Score_Engine SHALL compute the heart health score starting at a base value of 50.
2. WHEN daily fiber intake is greater than or equal to 25 grams, THE Heart_Score_Engine SHALL add 10 points to the score.
3. WHEN daily fiber intake exceeds 10 grams, THE Heart_Score_Engine SHALL add 5 points per 5 grams of fiber over 10 grams, capped at a maximum bonus of 15 points.
4. WHEN the user has completed at least one cardio workout today, THE Heart_Score_Engine SHALL add 15 points to the score.
5. WHEN daily calories consumed is less than or equal to the calorie intake target, THE Heart_Score_Engine SHALL add 10 points to the score.
6. WHEN daily fat consumed is less than or equal to the fat intake target, THE Heart_Score_Engine SHALL add 10 points to the score.
7. WHEN a food entry is flagged as heartUnhealthy, THE Heart_Score_Engine SHALL subtract 10 points from the score per flagged food entry.
8. THE Heart_Score_Engine SHALL clamp the final score to a range of 0 to 100.
9. THE Dashboard SHALL display the Heart Health Score with color coding: green for scores 70 or above, yellow for scores 40 to 69, red for scores below 40.
10. THE Dashboard SHALL list the names of heart-unhealthy flagged foods on the Heart Health Score card.

### Requirement 7: Weekly Trend Sparklines

**User Story:** As a user, I want to see 7-day trend charts for calories burned, consumed, and steps, so that I can observe patterns in my activity and nutrition over the past week.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Sparkline for daily calories burned over the past 7 days.
2. THE Dashboard SHALL display a Sparkline for daily calories consumed over the past 7 days.
3. THE Dashboard SHALL display a Sparkline for daily step count over the past 7 days.
4. THE Dashboard SHALL source sparkline data from daily summaries stored in IndexedDB_Store combined with current-day data from the Garmin_API.
5. WHEN fewer than 7 days of historical data exist, THE Dashboard SHALL display sparklines using only the available days.

### Requirement 8: Streak Counters

**User Story:** As a user, I want to see how many consecutive days I have met my burn goal and intake target, so that I can stay motivated by tracking my consistency.

#### Acceptance Criteria

1. THE Streak_Calculator SHALL compute a burn streak as the number of consecutive days (ending with the most recent qualifying day) where daily calories burned met or exceeded the burn goal.
2. THE Streak_Calculator SHALL compute an intake streak as the number of consecutive days (ending with the most recent qualifying day) where daily calories consumed was at or below the calorie intake target.
3. THE Streak_Calculator SHALL compute streaks from historical daily summaries stored in IndexedDB_Store.
4. THE Dashboard SHALL display both the burn streak and intake streak as numeric values.

### Requirement 9: Tab-Based Navigation

**User Story:** As a user, I want a bottom navigation bar to switch between Dashboard, Food Log, and Goals/Settings, so that I can access all sections of the app with a single tap.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL display three tabs at the bottom of the viewport: Dashboard, Food Log, and Goals/Settings.
2. WHEN the user taps a tab, THE Navigation_Bar SHALL navigate to the corresponding page.
3. THE Navigation_Bar SHALL highlight the active tab using the cyan accent color (#33FFE0).
4. THE Navigation_Bar SHALL remain visible on all pages.

### Requirement 10: Visual Design

**User Story:** As a user, I want a dark-themed interface with consistent styling, so that the app is comfortable to view and visually cohesive.

#### Acceptance Criteria

1. THE PWA SHALL use a background color of #0A0D1A (deep blue-black) for all pages.
2. THE PWA SHALL use a card background color of #141A29 (blue-dark) for all card components.
3. THE PWA SHALL use #33FFE0 (cyan) as the accent color for interactive elements, active states, and progress indicators.
4. THE PWA SHALL use white (#FFFFFF) as the primary text color.
5. THE PWA SHALL use gray as the secondary text color for labels and supporting information.
6. THE PWA SHALL apply the color scheme consistently across all pages (Dashboard, Food Log, Goals/Settings).

### Requirement 11: Local-First Persistence

**User Story:** As a user, I want my data stored locally on my device, so that I can view my food log, goals, and historical data even without an internet connection.

#### Acceptance Criteria

1. THE IndexedDB_Store SHALL persist food entries including name, calories, protein, carbs, fat, fiber, heartUnhealthy flag, reason, and timestamp.
2. THE IndexedDB_Store SHALL persist daily goals including calorie target, protein target, carbs target, fat target, and burn goal.
3. THE IndexedDB_Store SHALL persist daily summaries including date, total calories consumed, total calories burned, step count, resting heart rate, and workout list.
4. THE IndexedDB_Store SHALL use Dexie.js as the IndexedDB wrapper library.
5. WHILE the device is offline, THE PWA SHALL allow viewing of previously stored food entries, goals, and daily summaries.
6. WHILE the device is offline, THE PWA SHALL allow modification of daily goal values.
7. WHILE the device is offline, THE PWA SHALL display a visual indicator that Garmin sync and food parsing are unavailable.

### Requirement 12: PWA Installability

**User Story:** As a user, I want to install the app to my home screen on both Windows and iPhone, so that I can access it like a native application.

#### Acceptance Criteria

1. THE Service_Worker SHALL cache the application shell (HTML, CSS, JavaScript, icons) for offline access.
2. THE PWA SHALL include a web app manifest with required fields: name, short_name, start_url, display set to standalone, background_color, theme_color, and icons.
3. THE PWA SHALL be installable via the "Install App" option in Edge and Chrome on Windows.
4. THE PWA SHALL be installable via the "Add to Home Screen" option in Safari on iPhone.
5. WHEN the device is offline after installation, THE PWA SHALL load the cached application shell and display previously stored data.

### Requirement 13: Resting Heart Rate Display

**User Story:** As a user, I want to see my current resting heart rate and its 7-day trend, so that I can monitor my cardiovascular fitness over time.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current resting heart rate value in beats per minute sourced from the Garmin_API.
2. THE Dashboard SHALL display a 7-day Sparkline for resting heart rate history.
3. IF the Garmin_API does not return resting heart rate data, THEN THE Dashboard SHALL display a placeholder indicating data is unavailable.
4. THE Dashboard SHALL source historical resting heart rate data from daily summaries in IndexedDB_Store.

### Requirement 14: Platform and Deployment

**User Story:** As a developer, I want the application built with Next.js, TypeScript, and Tailwind CSS deployed to Vercel, so that I have a modern, maintainable stack with zero-cost hosting.

#### Acceptance Criteria

1. THE PWA SHALL be built using Next.js with TypeScript.
2. THE PWA SHALL use Tailwind CSS for styling.
3. THE PWA SHALL be deployable to Vercel free tier.
4. THE PWA SHALL store the OpenAI API key as a server-side environment variable, inaccessible to client-side code.
5. THE PWA SHALL store Garmin OAuth credentials (consumer key, consumer secret) as server-side environment variables, inaccessible to client-side code.
