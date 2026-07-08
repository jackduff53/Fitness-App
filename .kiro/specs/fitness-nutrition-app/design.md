# Design Document

## Overview

This document describes the technical architecture and design for the Fitness & Nutrition Tracking iOS app. The app is a native SwiftUI application targeting iOS 26+, using SwiftData for local persistence, HealthKit for fitness data integration, and Apple's on-device Foundation Models framework for natural language food parsing. No network connectivity or API keys are required for food parsing. The design follows MVVM architecture with clearly separated service layers.

## Architecture

The application uses an MVVM (Model-View-ViewModel) architecture with a service layer:

```
┌─────────────────────────────────────────────────────────┐
│                    Views (SwiftUI)                        │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Dashboard   │  │  Food Log  │  │  Goals/Settings  │  │
│  └──────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
└─────────┼────────────────┼──────────────────┼────────────┘
          │                │                  │
┌─────────┼────────────────┼──────────────────┼────────────┐
│         ▼                ▼                  ▼            │
│              ViewModels (@Observable)                     │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ DashboardVM  │  │ FoodLogVM  │  │    GoalsVM       │  │
│  └──────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
└─────────┼────────────────┼──────────────────┼────────────┘
          │                │                  │
┌─────────┼────────────────┼──────────────────┼────────────┐
│         ▼                ▼                  ▼            │
│                    Services Layer                         │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│  │HealthKitService│ │  FoodParser  │ │WorkoutRecommender│ │
│  └───────────────┘ └──────────────┘ └─────────────────┘ │
└──────────────────────────────────────────────────────────┘
          │                │                  │
┌─────────┼────────────────┼──────────────────┼────────────┐
│         ▼                ▼                  ▼            │
│              Data Layer (SwiftData)                       │
│  ┌───────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│  │  FoodEntry     │ │  DailyGoal   │ │  ModelContainer │ │
│  └───────────────┘ └──────────────┘ └─────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Data Models

### FoodEntry (SwiftData @Model)

```swift
import SwiftData
import Foundation

@Model
final class FoodEntry {
    var id: UUID
    var name: String
    var calories: Double
    var protein: Double
    var carbohydrates: Double
    var fat: Double
    var fiber: Double
    var heartUnhealthy: Bool
    var heartUnhealthyReason: String?
    var timestamp: Date
    
    init(name: String, calories: Double, protein: Double, carbohydrates: Double, fat: Double, fiber: Double = 0, heartUnhealthy: Bool = false, heartUnhealthyReason: String? = nil, timestamp: Date = .now) {
        self.id = UUID()
        self.name = name
        self.calories = calories
        self.protein = protein
        self.carbohydrates = carbohydrates
        self.fat = fat
        self.fiber = fiber
        self.heartUnhealthy = heartUnhealthy
        self.heartUnhealthyReason = heartUnhealthyReason
        self.timestamp = timestamp
    }
}
```

### DailyGoal (SwiftData @Model)

```swift
@Model
final class DailyGoal {
    var id: UUID
    var calorieTarget: Double
    var proteinTarget: Double
    var carbohydrateTarget: Double
    var fatTarget: Double
    var caloriesBurnedGoal: Double
    
    init(calorieTarget: Double = 2000, proteinTarget: Double = 150, carbohydrateTarget: Double = 250, fatTarget: Double = 65, caloriesBurnedGoal: Double = 500) {
        self.id = UUID()
        self.calorieTarget = calorieTarget
        self.proteinTarget = proteinTarget
        self.carbohydrateTarget = carbohydrateTarget
        self.fatTarget = fatTarget
        self.caloriesBurnedGoal = caloriesBurnedGoal
    }
}
```

### ParsedFoodResult (Transfer Object)

```swift
struct ParsedFoodResult: Codable, Equatable {
    let name: String
    let calories: Double
    let protein: Double
    let carbohydrates: Double
    let fat: Double
    let fiber: Double
    let heartUnhealthy: Bool
    let heartUnhealthyReason: String?
}
```

### HealthData (Transfer Object)

```swift
struct HealthData {
    var steps: Int
    var activeEnergyBurned: Double
    var workouts: [WorkoutEntry]
    var restingHeartRate: Int?
}

struct WorkoutEntry: Identifiable {
    let id: UUID
    let activityType: String
    let duration: TimeInterval
    let caloriesBurned: Double
    let date: Date
}
```

### WorkoutRecommendation

```swift
enum WorkoutCategory {
    case cardio
    case recovery
    case strength
}

struct WorkoutRecommendation {
    let category: WorkoutCategory
    let title: String
    let description: String
}
```

### DailySummary (SwiftData @Model)

Stores daily aggregates for sparkline data and streak computation.

```swift
@Model
final class DailySummary {
    var id: UUID
    var date: Date
    var totalCaloriesBurned: Double
    var totalCaloriesConsumed: Double
    var totalSteps: Int
    var metBurnGoal: Bool
    var metIntakeTarget: Bool
    
    init(date: Date, totalCaloriesBurned: Double = 0, totalCaloriesConsumed: Double = 0, totalSteps: Int = 0, metBurnGoal: Bool = false, metIntakeTarget: Bool = false) {
        self.id = UUID()
        self.date = date
        self.totalCaloriesBurned = totalCaloriesBurned
        self.totalCaloriesConsumed = totalCaloriesConsumed
        self.totalSteps = totalSteps
        self.metBurnGoal = metBurnGoal
        self.metIntakeTarget = metIntakeTarget
    }
}
```

### SparklinePoint (Transfer Object)

```swift
struct SparklinePoint: Identifiable {
    let id: UUID = UUID()
    let date: Date
    let value: Double
}

struct SparklineData {
    var burnedPoints: [SparklinePoint]
    var consumedPoints: [SparklinePoint]
    var stepsPoints: [SparklinePoint]
    var restingHRPoints: [SparklinePoint]
}
```

## Components and Interfaces

### HealthKitService

Responsible for requesting authorization and querying HealthKit data.

```swift
import HealthKit

@Observable
final class HealthKitService {
    private let healthStore = HKHealthStore()
    
    var healthData = HealthData(steps: 0, activeEnergyBurned: 0, workouts: [], restingHeartRate: nil)
    var authorizationStatus: AuthorizationStatus = .notDetermined
    
    enum AuthorizationStatus {
        case notDetermined, authorized, denied
    }
    
    /// Requests read authorization for step count, active energy, workout types, and resting heart rate
    func requestAuthorization() async throws { ... }
    
    /// Queries today's step count, active energy burned, workouts, and resting heart rate
    func fetchTodayData() async throws { ... }
    
    /// Queries step count for the current day
    private func fetchSteps() async throws -> Int { ... }
    
    /// Queries active energy burned in kcal for the current day
    private func fetchActiveEnergy() async throws -> Double { ... }
    
    /// Queries completed workouts for the current day (includes third-party synced data)
    private func fetchWorkouts() async throws -> [WorkoutEntry] { ... }
    
    /// Queries the most recent resting heart rate value
    private func fetchRestingHeartRate() async throws -> Int? { ... }
    
    /// Queries step count for each of the past 7 days
    func fetch7DaySteps() async throws -> [SparklinePoint] { ... }
    
    /// Queries active energy burned for each of the past 7 days
    func fetch7DayActiveEnergy() async throws -> [SparklinePoint] { ... }
    
    /// Queries resting heart rate for each of the past 7 days
    func fetch7DayRestingHeartRate() async throws -> [SparklinePoint] { ... }
}
```

**HealthKit Data Types Requested:**
- `HKQuantityType(.stepCount)` — read
- `HKQuantityType(.activeEnergyBurned)` — read
- `HKObjectType.workoutType()` — read
- `HKQuantityType(.restingHeartRate)` — read

### FoodParser

Handles on-device natural language food parsing using Apple's Foundation Models framework.

```swift
import FoundationModels

@Observable
final class FoodParser {
    private let session: LanguageModelSession
    
    enum ParserError: Error {
        case modelUnavailable
        case invalidResponse
        case decodingError
    }
    
    init() {
        // Initialize with system instruction for nutrition parsing
        let instructions = """
        You are a nutrition data assistant. Given a food description, return a JSON object with:
        - name: food item name (string)
        - calories: estimated total calories (number)
        - protein: grams of protein (number)
        - carbohydrates: grams of carbohydrates (number)
        - fat: grams of fat (number)
        - fiber: grams of dietary fiber (number)
        - heartUnhealthy: true if food is detrimental to heart health (high saturated fat, excessive sodium, alcohol, high-sugar), false otherwise
        - heartUnhealthyReason: if heartUnhealthy is true, short explanation; null otherwise
        Return ONLY the JSON object.
        """
        self.session = LanguageModelSession(instructions: instructions)
    }
    
    /// Parses a food description on-device using Foundation Models, returns structured nutritional data
    func parse(foodDescription: String) async throws -> ParsedFoodResult {
        guard LanguageModel.isAvailable else {
            throw ParserError.modelUnavailable
        }
        
        let response = try await session.respond(to: foodDescription)
        return try decodeResponse(response.content)
    }
    
    /// Decodes the model response text (JSON string) into ParsedFoodResult
    private func decodeResponse(_ text: String) throws -> ParsedFoodResult {
        guard let data = text.data(using: .utf8) else {
            throw ParserError.invalidResponse
        }
        do {
            return try JSONDecoder().decode(ParsedFoodResult.self, from: data)
        } catch {
            throw ParserError.decodingError
        }
    }
}
```

**On-Device Model Configuration:**
- Framework: Apple Foundation Models (iOS 26+)
- Session: `LanguageModelSession` initialized with system instructions
- Availability: Requires device with Apple Intelligence support (iPhone 15 Pro or later)
- No API key, endpoint configuration, or network connectivity required

### WorkoutRecommender

Static rule-based recommendation engine.

```swift
struct WorkoutRecommender {
    /// Returns a workout recommendation based on current energy burned vs goal
    func recommend(activeEnergyBurned: Double, dailyBurnGoal: Double) -> WorkoutRecommendation {
        if activeEnergyBurned < dailyBurnGoal {
            return WorkoutRecommendation(
                category: .cardio,
                title: "Cardio Workout",
                description: "You're below your burn goal. Try a run, bike ride, or brisk walk."
            )
        } else {
            return WorkoutRecommendation(
                category: .recovery,
                title: "Recovery & Strength",
                description: "Great job hitting your burn goal! Focus on stretching or light strength training."
            )
        }
    }
}
```

### NutritionCalculator

Pure functions for nutrition math used across ViewModels.

```swift
struct NutritionCalculator {
    /// Calculates the progress ratio (0.0+) for a given current value and target
    static func progressRatio(current: Double, target: Double) -> Double {
        guard target > 0 else { return 0 }
        return current / target
    }
    
    /// Sums all food entries' calories for the day
    static func totalCalories(entries: [FoodEntry]) -> Double {
        entries.reduce(0) { $0 + $1.calories }
    }
    
    /// Sums all food entries' protein for the day
    static func totalProtein(entries: [FoodEntry]) -> Double {
        entries.reduce(0) { $0 + $1.protein }
    }
    
    /// Sums all food entries' carbohydrates for the day
    static func totalCarbohydrates(entries: [FoodEntry]) -> Double {
        entries.reduce(0) { $0 + $1.carbohydrates }
    }
    
    /// Sums all food entries' fat for the day
    static func totalFat(entries: [FoodEntry]) -> Double {
        entries.reduce(0) { $0 + $1.fat }
    }
    
    /// Sums all food entries' fiber for the day
    static func totalFiber(entries: [FoodEntry]) -> Double {
        entries.reduce(0) { $0 + $1.fiber }
    }
}
```

### HeartHealthScoreCalculator

Pure function for computing the Heart Healthy Score based on daily food and workout inputs.

```swift
struct HeartHealthScoreCalculator {
    /// Computes the Heart Healthy Score (0-100) from the given daily inputs.
    ///
    /// Algorithm:
    /// - Start at 50 (neutral baseline)
    /// - +10 if totalFiber >= 25g
    /// - +5 per 5g of fiber over 10g (capped at +15)
    /// - +15 if any cardio workout completed today
    /// - +10 if caloriesConsumed <= calorieTarget
    /// - +10 if fatConsumed <= fatTarget
    /// - -10 per heart-unhealthy flagged food entry
    /// - Clamp result to 0-100
    static func calculateScore(
        totalFiber: Double,
        cardioWorkoutCount: Int,
        caloriesConsumed: Double,
        calorieTarget: Double,
        fatConsumed: Double,
        fatTarget: Double,
        heartUnhealthyCount: Int
    ) -> Int {
        var score = 50
        
        // Fiber bonus: +10 if fiber >= 25g
        if totalFiber >= 25 {
            score += 10
        }
        
        // Fiber graduated bonus: +5 per 5g over 10g, capped at +15
        if totalFiber > 10 {
            let fiberOver10 = totalFiber - 10
            let fiberBonusSteps = Int(fiberOver10 / 5)
            score += min(fiberBonusSteps * 5, 15)
        }
        
        // Cardio bonus: +15 if any cardio workout completed
        if cardioWorkoutCount > 0 {
            score += 15
        }
        
        // Calorie target bonus: +10 if within target
        if calorieTarget > 0 && caloriesConsumed <= calorieTarget {
            score += 10
        }
        
        // Fat target bonus: +10 if within target
        if fatTarget > 0 && fatConsumed <= fatTarget {
            score += 10
        }
        
        // Unhealthy food penalty: -10 per flagged entry
        score -= heartUnhealthyCount * 10
        
        // Clamp to 0-100
        return max(0, min(100, score))
    }
}
```

### StreakCalculator

Computes consecutive-day streaks for burn and intake goals from historical daily summaries.

```swift
struct StreakCalculator {
    /// Calculates burn streak and intake streak from daily summaries.
    /// Sorts summaries by date descending, counts consecutive days
    /// (going backwards from yesterday) where the respective goal was met.
    static func calculateStreaks(dailySummaries: [DailySummary]) -> (burnStreak: Int, intakeStreak: Int) {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // Sort by date descending
        let sorted = dailySummaries
            .filter { calendar.startOfDay(for: $0.date) < today }
            .sorted { $0.date > $1.date }
        
        var burnStreak = 0
        var intakeStreak = 0
        var burnBroken = false
        var intakeBroken = false
        
        var expectedDate = calendar.date(byAdding: .day, value: -1, to: today)!
        
        for summary in sorted {
            let summaryDate = calendar.startOfDay(for: summary.date)
            
            // Must be consecutive days
            guard summaryDate == expectedDate else { break }
            
            if !burnBroken {
                if summary.metBurnGoal {
                    burnStreak += 1
                } else {
                    burnBroken = true
                }
            }
            
            if !intakeBroken {
                if summary.metIntakeTarget {
                    intakeStreak += 1
                } else {
                    intakeBroken = true
                }
            }
            
            if burnBroken && intakeBroken { break }
            
            expectedDate = calendar.date(byAdding: .day, value: -1, to: expectedDate)!
        }
        
        return (burnStreak, intakeStreak)
    }
}
```

### SparklineDataProvider

Aggregates 7-day historical data from HealthKit and SwiftData for sparkline charts.

```swift
struct SparklineDataProvider {
    /// Aggregates 7-day sparkline data from HealthKit (steps, calories burned, resting HR)
    /// and SwiftData (calories consumed via DailySummary records).
    /// Returns SparklineData with arrays of SparklinePoint for each metric.
    static func fetch7DayData(
        healthKitService: HealthKitService,
        dailySummaries: [DailySummary]
    ) async throws -> SparklineData {
        let burnedPoints = try await healthKitService.fetch7DayActiveEnergy()
        let stepsPoints = try await healthKitService.fetch7DaySteps()
        let restingHRPoints = try await healthKitService.fetch7DayRestingHeartRate()
        
        // Consumed data from SwiftData DailySummary records
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let sevenDaysAgo = calendar.date(byAdding: .day, value: -6, to: today)!
        
        let consumedPoints = dailySummaries
            .filter { $0.date >= sevenDaysAgo }
            .sorted { $0.date < $1.date }
            .map { SparklinePoint(date: $0.date, value: $0.totalCaloriesConsumed) }
        
        return SparklineData(
            burnedPoints: burnedPoints,
            consumedPoints: consumedPoints,
            stepsPoints: stepsPoints,
            restingHRPoints: restingHRPoints
        )
    }
}
```

## ViewModels

### DashboardViewModel

```swift
@Observable
final class DashboardViewModel {
    private let healthKitService: HealthKitService
    private let workoutRecommender: WorkoutRecommender
    private let modelContext: ModelContext
    
    var caloriesBurnedProgress: Double { ... }
    var caloriesConsumedProgress: Double { ... }
    var steps: Int { ... }
    var recommendation: WorkoutRecommendation { ... }
    var todayWorkouts: [WorkoutEntry] { ... }
    var hasWorkouts: Bool { !todayWorkouts.isEmpty }
    
    /// Heart Healthy Score (0-100) computed from today's food entries and workouts
    var heartHealthScore: Int { ... }
    
    /// List of foods flagged as heart-unhealthy with their reasons
    var heartUnhealthyFlags: [(food: String, reason: String)] { ... }
    
    /// Current resting heart rate in BPM (nil if unavailable)
    var restingHeartRate: Int? { ... }
    
    /// 7-day sparkline data for all tracked metrics
    var sparklineData: SparklineData = SparklineData(burnedPoints: [], consumedPoints: [], stepsPoints: [], restingHRPoints: [])
    
    /// Consecutive days the user has met the daily calorie burn goal
    var burnStreak: Int = 0
    
    /// Consecutive days the user has stayed within the daily calorie intake target
    var intakeStreak: Int = 0
    
    /// Triggers HealthKit refresh, sparkline data load, score recalculation, and streak computation
    func onAppear() async { ... }
}
```

### FoodLogViewModel

```swift
@Observable
final class FoodLogViewModel {
    private let parser: FoodParser
    private let modelContext: ModelContext
    
    var inputText: String = ""
    var parsedResult: ParsedFoodResult?
    var isLoading: Bool = false
    var errorMessage: String?
    var showReview: Bool = false
    var todayEntries: [FoodEntry] = []
    
    /// Sends input text to parser, shows review on success
    func parseFood() async { ... }
    
    /// Confirms and saves the parsed (or edited) food entry
    func confirmEntry(result: ParsedFoodResult) { ... }
    
    /// Loads today's food entries from SwiftData
    func loadTodayEntries() { ... }
}
```

### GoalsViewModel

```swift
@Observable
final class GoalsViewModel {
    private let modelContext: ModelContext
    
    var calorieTarget: Double = 2000
    var proteinTarget: Double = 150
    var carbohydrateTarget: Double = 250
    var fatTarget: Double = 65
    var caloriesBurnedGoal: Double = 500
    
    // Macronutrient progress (consumed / target)
    var proteinProgress: Double { ... }
    var carbsProgress: Double { ... }
    var fatProgress: Double { ... }
    var todayFoodEntries: [FoodEntry] = []
    
    /// Loads persisted goals from SwiftData
    func loadGoals() { ... }
    
    /// Saves current goal values to SwiftData
    func saveGoals() { ... }
    
    /// Loads today's food entries and computes macro progress
    func loadTodayNutrition() { ... }
}
```

## Views

### App Entry Point

```swift
@main
struct FitnessNutritionApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(for: [FoodEntry.self, DailyGoal.self])
        }
    }
}
```

### ContentView (Tab Navigation)

```swift
struct ContentView: View {
    @State private var selectedTab: Tab = .dashboard
    
    enum Tab: String, CaseIterable {
        case dashboard = "Dashboard"
        case foodLog = "Food Log"
        case goals = "Goals"
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem { Label("Dashboard", systemImage: "chart.bar.fill") }
                .tag(Tab.dashboard)
            
            FoodLogView()
                .tabItem { Label("Food Log", systemImage: "fork.knife") }
                .tag(Tab.foodLog)
            
            GoalsSettingsView()
                .tabItem { Label("Goals", systemImage: "target") }
                .tag(Tab.goals)
        }
        .tint(AppTheme.cyanAccent)
    }
}
```

### Visual Theme

```swift
enum AppTheme {
    static let background = Color(red: 0.04, green: 0.05, blue: 0.10)
    static let cardBackground = Color(red: 0.08, green: 0.10, blue: 0.16)
    static let cyanAccent = Color(red: 0.2, green: 1.0, blue: 0.88)
    static let textPrimary = Color.white
    static let textSecondary = Color.gray
}
```

### DashboardView

Displays the primary calories burned progress ring, workout recommendation, calories consumed progress ring, step count, resting heart rate, workout stats, heart health score, weekly trends, and streak counters.

```swift
struct DashboardView: View {
    @State private var viewModel: DashboardViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 1. Primary Metric: Calories Burned vs Goal
                ProgressRingView(progress: viewModel.caloriesBurnedProgress, label: "Burned")
                
                // 2. Workout Recommendation Card (prominent)
                RecommendationCard(recommendation: viewModel.recommendation)
                
                // 3. Second Metric: Calories Consumed vs Goal
                ProgressRingView(progress: viewModel.caloriesConsumedProgress, label: "Consumed")
                
                // 4. Step Count Card
                MetricCard(title: "Steps", value: "\(viewModel.steps)")
                
                // 5. Resting Heart Rate Card
                RestingHeartRateCard(
                    bpm: viewModel.restingHeartRate,
                    sparklinePoints: viewModel.sparklineData.restingHRPoints
                )
                
                // 6. Today's Workout Stats
                WorkoutStatsSection(workouts: viewModel.todayWorkouts, hasWorkouts: viewModel.hasWorkouts)
                
                // 7. Heart Healthy Score Card
                HeartHealthCard(score: viewModel.heartHealthScore, flaggedFoods: viewModel.heartUnhealthyFlags)
                
                // 8. Weekly Trends Section (7-day sparklines)
                WeeklyTrendsSection(sparklineData: viewModel.sparklineData)
                
                // 9. Streak Counters
                StreakCard(burnStreak: viewModel.burnStreak, intakeStreak: viewModel.intakeStreak)
            }
            .padding()
        }
        .background(AppTheme.background)
        .task { await viewModel.onAppear() }
    }
}
```

### WorkoutStatsSection

Displays today's completed workouts or an empty state when none are recorded.

```swift
struct WorkoutStatsSection: View {
    let workouts: [WorkoutEntry]
    let hasWorkouts: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today's Workouts")
                .font(.headline)
                .foregroundColor(AppTheme.textPrimary)
            
            if hasWorkouts {
                ForEach(workouts) { workout in
                    HStack {
                        Text(workout.activityType)
                            .foregroundColor(AppTheme.textPrimary)
                        Spacer()
                        Text("\(Int(workout.duration / 60)) min")
                            .foregroundColor(AppTheme.textSecondary)
                        Text("\(Int(workout.caloriesBurned)) kcal")
                            .foregroundColor(AppTheme.cyanAccent)
                    }
                    .padding()
                    .background(AppTheme.cardBackground)
                    .cornerRadius(10)
                }
            } else {
                Text("No workouts logged today")
                    .foregroundColor(AppTheme.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(AppTheme.cardBackground)
                    .cornerRadius(10)
            }
        }
    }
}
```

### HeartHealthCard

Displays the Heart Healthy Score (0-100) with a color-coded indicator and optionally lists flagged foods.

```swift
struct HeartHealthCard: View {
    let score: Int
    let flaggedFoods: [(food: String, reason: String)]
    
    /// Returns color based on score: green >= 70, yellow 40-69, red < 40
    private var scoreColor: Color {
        if score >= 70 { return .green }
        else if score >= 40 { return .yellow }
        else { return .red }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Heart Health Score")
                    .font(.headline)
                    .foregroundColor(AppTheme.textPrimary)
                Spacer()
                Text("\(score)")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(scoreColor)
            }
            
            // Color-coded progress indicator
            ProgressView(value: Double(score), total: 100)
                .tint(scoreColor)
            
            // Flagged foods list (if any)
            if !flaggedFoods.isEmpty {
                Divider()
                Text("Flagged Foods")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
                ForEach(flaggedFoods, id: \.food) { item in
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                            .font(.caption)
                        Text(item.food)
                            .foregroundColor(AppTheme.textPrimary)
                        Spacer()
                        Text(item.reason)
                            .font(.caption)
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
            }
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(12)
    }
}
```

### ProgressRingView

```swift
struct ProgressRingView: View {
    let progress: Double
    let label: String
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(AppTheme.cardBackground, lineWidth: 12)
            Circle()
                .trim(from: 0, to: min(progress, 1.0))
                .stroke(AppTheme.cyanAccent, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(Int(progress * 100))%")
                .font(.headline)
                .foregroundColor(AppTheme.textPrimary)
        }
        .frame(width: 120, height: 120)
    }
}
```

### FoodLogView

```swift
struct FoodLogView: View {
    @State private var viewModel: FoodLogViewModel
    
    var body: some View {
        NavigationStack {
            VStack {
                // Input area
                HStack {
                    TextField("Describe your food...", text: $viewModel.inputText)
                        .textFieldStyle(.plain)
                        .padding()
                        .background(AppTheme.cardBackground)
                        .cornerRadius(12)
                    
                    Button("Log") { Task { await viewModel.parseFood() } }
                        .buttonStyle(.borderedProminent)
                        .tint(AppTheme.cyanAccent)
                        .disabled(viewModel.inputText.isEmpty || viewModel.isLoading)
                }
                .padding()
                
                // Today's entries list
                List(viewModel.todayEntries) { entry in
                    FoodEntryRow(entry: entry)
                }
                .listStyle(.plain)
            }
            .background(AppTheme.background)
            .sheet(isPresented: $viewModel.showReview) {
                FoodReviewSheet(result: $viewModel.parsedResult, onConfirm: viewModel.confirmEntry)
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("Manual Entry") { viewModel.showManualEntry() }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }
}
```

### FoodReviewSheet

Displays parsed nutritional data with editable fields before confirmation. Fiber and heart-unhealthy flag are shown as read-only.

```swift
struct FoodReviewSheet: View {
    @Binding var result: ParsedFoodResult?
    let onConfirm: (ParsedFoodResult) -> Void
    
    @State private var editableName: String = ""
    @State private var editableCalories: String = ""
    @State private var editableProtein: String = ""
    @State private var editableCarbs: String = ""
    @State private var editableFat: String = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Parsed Food") {
                    TextField("Name", text: $editableName)
                    TextField("Calories", text: $editableCalories)
                        .keyboardType(.decimalPad)
                    TextField("Protein (g)", text: $editableProtein)
                        .keyboardType(.decimalPad)
                    TextField("Carbs (g)", text: $editableCarbs)
                        .keyboardType(.decimalPad)
                    TextField("Fat (g)", text: $editableFat)
                        .keyboardType(.decimalPad)
                }
                
                Section("Additional Info (read-only)") {
                    HStack {
                        Text("Fiber")
                        Spacer()
                        Text("\(result?.fiber ?? 0, specifier: "%.1f") g")
                            .foregroundColor(AppTheme.textSecondary)
                    }
                    
                    if result?.heartUnhealthy == true {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text("Heart Unhealthy")
                            Spacer()
                            Text(result?.heartUnhealthyReason ?? "")
                                .foregroundColor(AppTheme.textSecondary)
                                .font(.caption)
                        }
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Confirm") { confirmEdited() }
                        .tint(AppTheme.cyanAccent)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { result = nil }
                }
            }
        }
    }
}
```

### GoalsSettingsView

Displays editable goal targets and macronutrient progress bars showing consumed vs target ratios.

```swift
struct GoalsSettingsView: View {
    @State private var viewModel: GoalsViewModel
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Daily Targets") {
                    GoalTextField(label: "Calorie Target (kcal)", value: $viewModel.calorieTarget)
                    GoalTextField(label: "Burn Goal (kcal)", value: $viewModel.caloriesBurnedGoal)
                    GoalTextField(label: "Protein (g)", value: $viewModel.proteinTarget)
                    GoalTextField(label: "Carbohydrates (g)", value: $viewModel.carbohydrateTarget)
                    GoalTextField(label: "Fat (g)", value: $viewModel.fatTarget)
                }
                
                Section("Macronutrient Progress") {
                    ProgressBarView(progress: viewModel.proteinProgress, label: "Protein")
                    ProgressBarView(progress: viewModel.carbsProgress, label: "Carbs")
                    ProgressBarView(progress: viewModel.fatProgress, label: "Fat")
                }
            }
            .navigationTitle("Goals & Settings")
            .background(AppTheme.background)
            .task {
                viewModel.loadGoals()
                viewModel.loadTodayNutrition()
            }
            .onChange(of: viewModel.calorieTarget) { viewModel.saveGoals() }
            .onChange(of: viewModel.proteinTarget) { viewModel.saveGoals() }
            .onChange(of: viewModel.carbohydrateTarget) { viewModel.saveGoals() }
            .onChange(of: viewModel.fatTarget) { viewModel.saveGoals() }
            .onChange(of: viewModel.caloriesBurnedGoal) { viewModel.saveGoals() }
        }
    }
}
```

## On-Device Model Integration

### Foundation Models Usage

The app uses Apple's Foundation Models framework to parse natural language food descriptions entirely on-device. A `LanguageModelSession` is initialized with system instructions that define the expected JSON output format for nutritional data.

**System Instructions (passed to LanguageModelSession):**
```
You are a nutrition data assistant. Given a food description, return a JSON object with:
- name: food item name (string)
- calories: estimated total calories (number)
- protein: grams of protein (number)
- carbohydrates: grams of carbohydrates (number)
- fat: grams of fat (number)
- fiber: grams of dietary fiber (number)
- heartUnhealthy: true if food is detrimental to heart health (high saturated fat, excessive sodium, alcohol, high-sugar), false otherwise
- heartUnhealthyReason: if heartUnhealthy is true, short explanation; null otherwise
Return ONLY the JSON object.
```

**Request Flow:**
1. User enters natural language description (e.g., "grilled chicken breast with rice")
2. `FoodLogViewModel` calls `FoodParser.parse(foodDescription:)`
3. Parser checks `LanguageModel.isAvailable` — throws `modelUnavailable` if device lacks Apple Intelligence
4. Parser calls `session.respond(to: foodDescription)` — on-device inference, no network required
5. Response text (JSON string) is decoded into `ParsedFoodResult`
6. On success: review sheet presented with editable fields
7. On error: error alert with manual entry option (no retry — not a network issue)

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Model unavailable | Show message that Apple Intelligence is required, allow manual entry |
| Invalid JSON response | Show error alert, allow manual entry |
| Decoding error | Show error alert, allow manual entry |
| HealthKit denied | Show informational message with Settings link |
| HealthKit unavailable | Show graceful degradation message |

## Data Flow

### Food Logging Flow

```
User Input → FoodParser → ParsedFoodResult → Review Sheet → Confirm → SwiftData
                                                      ↓ (edit)
                                              Modified ParsedFoodResult → Confirm → SwiftData
```

### Dashboard Data Flow

```
onAppear → HealthKitService.fetchTodayData()
         → SwiftData query (today's FoodEntries)
         → SwiftData query (DailyGoal)
         → NutritionCalculator computes:
              • Calories burned progress ratio
              • Calories consumed progress ratio
              • Total fiber
         → WorkoutRecommender.recommend()
         → HeartHealthScoreCalculator.calculateScore():
              • totalFiber from NutritionCalculator
              • cardioWorkoutCount from HealthKit workouts
              • caloriesConsumed vs calorieTarget
              • fatConsumed vs fatTarget
              • heartUnhealthyCount from flagged FoodEntries
         → HealthKitService provides:
              • Step count
              • Today's workout list (type, duration, calories per workout)
         → UI renders all computed values
              • Empty state shown if workout list is empty
              • HeartHealthCard displays score and flagged foods
```

### Goal Persistence Flow

```
User edits goals → GoalsViewModel.saveGoals() → SwiftData upsert DailyGoal
App launch → GoalsViewModel.loadGoals() → SwiftData fetch DailyGoal → populate fields
```

## SwiftData Configuration

```swift
let container = try ModelContainer(for: FoodEntry.self, DailyGoal.self)
```

**Query Patterns:**
- Today's food entries: `#Predicate<FoodEntry> { Calendar.current.isDateInToday($0.timestamp) }`
- Today's heart-unhealthy entries: `#Predicate<FoodEntry> { Calendar.current.isDateInToday($0.timestamp) && $0.heartUnhealthy }`
- Current goals: Fetch first `DailyGoal` or create default

## File Structure

```
FitnessNutritionApp/
├── App/
│   └── FitnessNutritionApp.swift
├── Models/
│   ├── FoodEntry.swift
│   ├── DailyGoal.swift
│   ├── ParsedFoodResult.swift
│   ├── HealthData.swift
│   └── WorkoutRecommendation.swift
├── ViewModels/
│   ├── DashboardViewModel.swift
│   ├── FoodLogViewModel.swift
│   └── GoalsViewModel.swift
├── Views/
│   ├── ContentView.swift
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── ProgressRingView.swift
│   │   ├── MetricCard.swift
│   │   ├── RecommendationCard.swift
│   │   ├── WorkoutStatsSection.swift
│   │   └── HeartHealthCard.swift
│   ├── FoodLog/
│   │   ├── FoodLogView.swift
│   │   ├── FoodReviewSheet.swift
│   │   └── FoodEntryRow.swift
│   └── Goals/
│       ├── GoalsSettingsView.swift
│       └── ProgressBarView.swift
├── Services/
│   ├── HealthKitService.swift
│   ├── FoodParser.swift
│   ├── WorkoutRecommender.swift
│   ├── NutritionCalculator.swift
│   └── HeartHealthScoreCalculator.swift
└── Theme/
    └── AppTheme.swift
```

## Testing Strategy

**Unit Tests** cover specific examples and edge cases:
- HealthKit authorization denied shows correct UI state
- FoodParser model unavailable triggers error flow with Apple Intelligence message
- Empty food log displays correct empty state
- Default goal values are applied on first launch
- Tab bar has exactly three tabs with correct labels
- Dashboard shows empty state message when no workouts recorded
- Workout stats display correct type, duration, and calories per workout

**Property-Based Tests** verify universal properties (minimum 100 iterations each):
- `NutritionCalculator` ratio calculations for arbitrary numeric inputs
- `FoodParser` response decoding for any well-formed JSON (including fiber and heartUnhealthy fields)
- Food entry and goal persistence round-trips for any valid data
- Daily totals aggregation for any list of food entries (including fiber)
- Workout recommendation logic for any non-negative energy values
- `HeartHealthScoreCalculator` for any valid combination of inputs produces a score clamped to 0-100 with correct rule application

**Integration Tests** verify component interaction:
- HealthKit query returns data for the current day after authorization
- SwiftData container loads and saves without network access
- Full food logging flow from text input to persisted entry
- GoalsSettingsView displays macro progress bars reflecting current food entries

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Progress indicator ratio calculation

*For any* non-negative current value and positive target value, the progress ratio calculated by `NutritionCalculator.progressRatio(current:target:)` SHALL equal `current / target`, and for a zero target SHALL return 0.

**Validates: Requirements 2.1, 2.3, 4.4**

### Property 2: Food parser response decoding completeness

*For any* valid JSON response containing `name`, `calories`, `protein`, `carbohydrates`, `fat`, `fiber`, `heartUnhealthy`, and `heartUnhealthyReason` fields, the `FoodParser.decodeResponse(_:)` function SHALL produce a `ParsedFoodResult` with all fields populated and matching the source values.

**Validates: Requirements 3.2, 10.7, 10.8**

### Property 3: Food entry persistence round-trip

*For any* valid `ParsedFoodResult` that is confirmed and saved, querying the `SwiftData_Store` for today's entries SHALL return an entry with matching `name`, `calories`, `protein`, `carbohydrates`, `fat`, and a timestamp within the current day.

**Validates: Requirements 3.4, 5.2**

### Property 4: Goal configuration persistence round-trip

*For any* valid goal configuration (positive calorie target, protein target, carbohydrate target, and fat target), persisting via `GoalsViewModel.saveGoals()` and then loading via `GoalsViewModel.loadGoals()` SHALL return identical target values.

**Validates: Requirements 4.1, 4.2, 4.5, 5.3**

### Property 5: Daily nutrition totals aggregation

*For any* list of food entries for the current day, the total calories SHALL equal the sum of each entry's calories, total protein SHALL equal the sum of each entry's protein, total carbohydrates SHALL equal the sum of each entry's carbohydrates, and total fat SHALL equal the sum of each entry's fat.

**Validates: Requirements 4.3**

### Property 6: Workout recommendation rule correctness

*For any* active energy burned value and daily burn goal where both are non-negative: if burned < goal, the `WorkoutRecommender` SHALL return a cardio-category recommendation; if burned >= goal, it SHALL return a recovery or strength-category recommendation.

**Validates: Requirements 8.1, 8.2**

### Property 7: Tab navigation mapping

*For any* tab selection from the set {Dashboard, Food Log, Goals/Settings}, the `Navigation_Controller` SHALL display exactly the screen corresponding to that tab with no intermediate navigation steps.

**Validates: Requirements 7.2**

### Property 8: Heart Healthy Score calculation correctness

*For any* valid combination of inputs — total fiber (non-negative Double), cardio workout count (non-negative Int), calories consumed (non-negative Double), calorie target (positive Double), fat consumed (non-negative Double), fat target (positive Double), and heart-unhealthy flag count (non-negative Int) — the `HeartHealthScoreCalculator.calculateScore()` SHALL return a score clamped to the range 0-100 and SHALL correctly apply the scoring rules: starting at 50, +10 if fiber >= 25g, +5 per 5g of fiber over 10g (capped at +15), +15 if cardio workout count > 0, +10 if calories consumed <= calorie target, +10 if fat consumed <= fat target, and -10 per heart-unhealthy flagged food entry.

**Validates: Requirements 10.3, 10.4**
