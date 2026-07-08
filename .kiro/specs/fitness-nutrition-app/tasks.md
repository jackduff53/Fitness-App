# Implementation Plan: Fitness & Nutrition Tracking App

## Overview

A native iOS 26+ SwiftUI app using MVVM architecture with SwiftData persistence, HealthKit integration, on-device Apple Foundation Models food parsing, 7-day sparkline trends, streak counters, and a rule-based Heart Healthy Score. No external APIs or network connectivity required for core functionality.

## Tasks

- [ ] 1. Set up project structure, theme, and core data models
  - [ ] 1.1 Create Xcode project structure with all directories and the AppTheme
    - Create `FitnessNutritionApp/` directory structure matching the file layout in the design (App/, Models/, ViewModels/, Views/, Services/, Theme/)
    - Create `AppTheme.swift` with `background`, `cardBackground`, `cyanAccent`, `textPrimary`, `textSecondary` static color definitions
    - Create the app entry point `FitnessNutritionApp.swift` with `@main` struct and `ModelContainer` for all SwiftData models
    - _Requirements: 6.1, 6.2, 6.4, 9.1, 9.2_

  - [ ] 1.2 Create SwiftData models: FoodEntry, DailyGoal, DailySummary
    - Implement `FoodEntry` @Model with fields: id, name, calories, protein, carbohydrates, fat, fiber, heartUnhealthy, heartUnhealthyReason, timestamp
    - Implement `DailyGoal` @Model with fields: id, calorieTarget, proteinTarget, carbohydrateTarget, fatTarget, caloriesBurnedGoal (with defaults)
    - Implement `DailySummary` @Model with fields: id, date, totalCaloriesBurned, totalCaloriesConsumed, totalSteps, metBurnGoal, metIntakeTarget
    - _Requirements: 5.1, 5.2, 5.3, 12.5_

  - [ ] 1.3 Create transfer objects: ParsedFoodResult, HealthData, WorkoutEntry, WorkoutRecommendation, SparklinePoint, SparklineData
    - Implement `ParsedFoodResult` as Codable struct with all nutrition fields plus fiber, heartUnhealthy, heartUnhealthyReason
    - Implement `HealthData` struct with steps, activeEnergyBurned, workouts, restingHeartRate
    - Implement `WorkoutEntry` as Identifiable struct with id, activityType, duration, caloriesBurned, date
    - Implement `WorkoutRecommendation` struct with category enum (cardio, recovery, strength), title, description
    - Implement `SparklinePoint` (Identifiable) and `SparklineData` structs
    - _Requirements: 3.2, 10.7, 10.8, 11.1, 11.2, 11.3, 13.4_

- [ ] 2. Implement service layer
  - [ ] 2.1 Implement NutritionCalculator
    - Create `NutritionCalculator.swift` with static methods: `progressRatio(current:target:)`, `totalCalories(entries:)`, `totalProtein(entries:)`, `totalCarbohydrates(entries:)`, `totalFat(entries:)`, `totalFiber(entries:)`
    - Ensure `progressRatio` returns 0 when target is 0, and `current / target` otherwise
    - _Requirements: 2.1, 2.3, 4.3, 4.4_

  - [ ]* 2.2 Write property test for NutritionCalculator progress ratio
    - **Property 1: Progress indicator ratio calculation**
    - For any non-negative current and positive target, verify ratio equals current/target; for zero target verify returns 0
    - **Validates: Requirements 2.1, 2.3, 4.4**

  - [ ] 2.3 Implement WorkoutRecommender
    - Create `WorkoutRecommender.swift` with `recommend(activeEnergyBurned:dailyBurnGoal:)` method
    - Return cardio recommendation when burned < goal, recovery/strength when burned >= goal
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 2.4 Write property test for WorkoutRecommender
    - **Property 6: Workout recommendation rule correctness**
    - For any non-negative energy burned and goal: burned < goal → cardio; burned >= goal → recovery/strength
    - **Validates: Requirements 8.1, 8.2**

  - [ ] 2.5 Implement HeartHealthScoreCalculator
    - Create `HeartHealthScoreCalculator.swift` with static `calculateScore()` method
    - Implement scoring: baseline 50, +10 fiber>=25g, +5 per 5g over 10g (cap +15), +15 cardio, +10 within calorie target, +10 within fat target, -10 per unhealthy food
    - Clamp result to 0-100
    - _Requirements: 10.2, 10.3, 10.4, 10.9_

  - [ ]* 2.6 Write property test for HeartHealthScoreCalculator
    - **Property 8: Heart Healthy Score calculation correctness**
    - For any valid combination of inputs, verify score is clamped 0-100 and rules are correctly applied
    - **Validates: Requirements 10.3, 10.4**

  - [ ] 2.7 Implement StreakCalculator
    - Create `StreakCalculator.swift` with static `calculateStreaks(dailySummaries:)` method
    - Sort summaries by date descending, count consecutive days from yesterday where respective goal was met
    - Return (burnStreak, intakeStreak) tuple
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

  - [ ] 2.8 Implement SparklineDataProvider
    - Create `SparklineDataProvider.swift` with static `fetch7DayData(healthKitService:dailySummaries:)` async method
    - Aggregate burned, steps, resting HR from HealthKit and consumed from DailySummary records
    - Filter to past 7 days, handle fewer than 7 days gracefully
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.6_

- [ ] 3. Implement HealthKit and FoodParser services
  - [ ] 3.1 Implement HealthKitService
    - Create `HealthKitService.swift` as @Observable class with HKHealthStore
    - Implement `requestAuthorization()` for stepCount, activeEnergyBurned, workoutType, restingHeartRate
    - Implement `fetchTodayData()` calling private helpers for steps, active energy, workouts, resting HR
    - Implement `fetch7DaySteps()`, `fetch7DayActiveEnergy()`, `fetch7DayRestingHeartRate()` returning [SparklinePoint]
    - Handle authorization denied state with informational message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 13.1, 13.2_

  - [ ] 3.2 Implement FoodParser with Apple Foundation Models
    - Create `FoodParser.swift` as @Observable class using `import FoundationModels`
    - Initialize `LanguageModelSession` with system instructions for JSON nutrition parsing (including fiber, heartUnhealthy, heartUnhealthyReason)
    - Implement `parse(foodDescription:)` that checks `LanguageModel.isAvailable`, calls `session.respond(to:)`, and decodes JSON response
    - Implement `decodeResponse(_:)` private method with proper error handling
    - Define `ParserError` enum: modelUnavailable, invalidResponse, decodingError
    - _Requirements: 3.1, 3.2, 3.7, 3.8, 5.7, 10.7, 10.8_

  - [ ]* 3.3 Write property test for FoodParser response decoding
    - **Property 2: Food parser response decoding completeness**
    - For any valid JSON with all required fields, verify decodeResponse produces ParsedFoodResult with matching values
    - **Validates: Requirements 3.2, 10.7, 10.8**

- [ ] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement ViewModels
  - [ ] 5.1 Implement DashboardViewModel
    - Create `DashboardViewModel.swift` as @Observable class
    - Inject HealthKitService, WorkoutRecommender, and ModelContext
    - Compute caloriesBurnedProgress, caloriesConsumedProgress, steps, recommendation, todayWorkouts, hasWorkouts
    - Compute heartHealthScore using HeartHealthScoreCalculator with today's food entries and workouts
    - Compute heartUnhealthyFlags list from today's flagged food entries
    - Expose restingHeartRate, sparklineData, burnStreak, intakeStreak
    - Implement `onAppear()` that fetches HealthKit data, loads food entries, computes score, loads sparkline data, and calculates streaks
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 10.5, 13.3, 13.5_

  - [ ] 5.2 Implement FoodLogViewModel
    - Create `FoodLogViewModel.swift` as @Observable class
    - Inject FoodParser and ModelContext
    - Implement `parseFood()` that sets isLoading, calls parser, handles success (show review) and errors
    - Implement `confirmEntry(result:)` that creates FoodEntry from ParsedFoodResult, saves to SwiftData
    - Implement `loadTodayEntries()` querying SwiftData for today's food entries
    - Handle model unavailable error with Apple Intelligence required message
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 4.3_

  - [ ] 5.3 Implement GoalsViewModel
    - Create `GoalsViewModel.swift` as @Observable class
    - Inject ModelContext
    - Implement `loadGoals()` fetching DailyGoal from SwiftData (create default if none)
    - Implement `saveGoals()` upserting DailyGoal to SwiftData
    - Implement `loadTodayNutrition()` querying today's entries and computing macro progress using NutritionCalculator
    - Expose proteinProgress, carbsProgress, fatProgress computed properties
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.4 Write property test for daily nutrition totals aggregation
    - **Property 5: Daily nutrition totals aggregation**
    - For any list of food entries, verify totalCalories/protein/carbs/fat equals sum of respective fields
    - **Validates: Requirements 4.3**

- [ ] 6. Implement Dashboard views
  - [ ] 6.1 Implement ProgressRingView and MetricCard
    - Create `ProgressRingView.swift` with progress (0.0+) and label parameters; draw circular ring with AppTheme.cyanAccent
    - Create `MetricCard.swift` for displaying a single metric (title + value) with card background styling
    - _Requirements: 2.1, 2.3, 6.2, 6.4_

  - [ ] 6.2 Implement RecommendationCard and WorkoutStatsSection
    - Create `RecommendationCard.swift` displaying workout recommendation title and description
    - Create `WorkoutStatsSection.swift` showing today's workouts list with type, duration (min), calories or empty state
    - _Requirements: 2.2, 2.6, 2.7, 8.4_

  - [ ] 6.3 Implement HeartHealthCard
    - Create `HeartHealthCard.swift` displaying score with color coding (green >= 70, yellow 40-69, red < 40)
    - Show progress bar and flagged foods list with exclamation triangle icons
    - _Requirements: 2.8, 10.1, 10.6_

  - [ ] 6.4 Implement RestingHeartRateCard, WeeklyTrendsSection, and StreakCard
    - Create `RestingHeartRateCard.swift` showing BPM value and 7-day HR sparkline, with placeholder for unavailable data
    - Create `WeeklyTrendsSection.swift` with compact inline sparkline charts for burned, consumed, steps using SwiftUI Charts or manual Path drawing
    - Create `StreakCard.swift` showing burn streak and intake streak counts
    - _Requirements: 2.5, 2.9, 2.10, 11.4, 13.3, 13.4, 13.5_

  - [ ] 6.5 Implement DashboardView composing all sections in correct order
    - Create `DashboardView.swift` with ScrollView containing sections in order: Burned ring → Recommendation → Consumed ring → Steps → Resting HR → Workout Stats → Heart Health → Weekly Trends → Streaks
    - Apply AppTheme.background, trigger viewModel.onAppear() in .task modifier
    - _Requirements: 2.11, 6.1_

- [ ] 7. Implement Food Log and Goals views
  - [ ] 7.1 Implement FoodLogView and FoodReviewSheet
    - Create `FoodLogView.swift` with text input field, "Log" button, today's entries list, error alert with manual entry option
    - Create `FoodReviewSheet.swift` as sheet with editable fields (name, calories, protein, carbs, fat), read-only fiber and heart-unhealthy info, confirm/cancel toolbar buttons
    - Create `FoodEntryRow.swift` for list item display
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

  - [ ] 7.2 Implement GoalsSettingsView and ProgressBarView
    - Create `GoalsSettingsView.swift` with Form containing editable goal fields and macronutrient progress section
    - Create `ProgressBarView.swift` for horizontal progress bar with label
    - Wire onChange handlers for auto-saving goals
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 8. Implement tab navigation and wire everything together
  - [ ] 8.1 Implement ContentView with TabView
    - Create `ContentView.swift` with TabView containing Dashboard, Food Log, and Goals tabs
    - Apply tint(AppTheme.cyanAccent) for active tab indicator
    - Use appropriate SF Symbols: chart.bar.fill, fork.knife, target
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 8.2 Wire ModelContainer and dependency injection
    - Update `FitnessNutritionApp.swift` ModelContainer to include FoodEntry, DailyGoal, DailySummary
    - Ensure ViewModels receive ModelContext and services through environment or init injection
    - Verify all tabs instantiate their ViewModels with correct dependencies
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 9.4_

- [ ] 9. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Write remaining property tests
  - [ ]* 10.1 Write property test for food entry persistence round-trip
    - **Property 3: Food entry persistence round-trip**
    - For any valid ParsedFoodResult confirmed and saved, verify SwiftData returns entry with matching fields and today's timestamp
    - **Validates: Requirements 3.4, 5.2**

  - [ ]* 10.2 Write property test for goal configuration persistence round-trip
    - **Property 4: Goal configuration persistence round-trip**
    - For any valid goal configuration, verify saveGoals() followed by loadGoals() returns identical values
    - **Validates: Requirements 4.1, 4.2, 4.5, 5.3**

  - [ ]* 10.3 Write property test for tab navigation mapping
    - **Property 7: Tab navigation mapping**
    - For any tab selection from {Dashboard, Food Log, Goals}, verify the correct screen is displayed
    - **Validates: Requirements 7.2**

- [ ] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The app targets iOS 26+ and requires iPhone 15 Pro or later for Apple Intelligence food parsing
- No external APIs, network calls, or API keys are needed — all parsing is on-device via Apple Foundation Models
- The visual theme uses a cool cyan accent (#33FFE0) on a deep blue-black background

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "2.7", "2.8", "3.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6", "3.3"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["5.4", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 5, "tasks": ["6.5", "7.1", "7.2"] },
    { "id": 6, "tasks": ["8.1", "8.2"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3"] }
  ]
}
```
