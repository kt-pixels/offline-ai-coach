# Aegis Coach OS - Personalized Nutrition Intelligence SaaS (MERN)

A premium SaaS-style self-improvement platform with:

- Multi-step onboarding (no assumed health data)
- Personalized calorie intelligence engine
- Meal distribution + timer system
- Global food database search with gram-based nutrition calculations
- Task, habit, workout, and AI coaching modules

All AI intelligence runs locally through internal rule engines and scoring logic.

## Core Principle

The system **does not assume user health data**.

All nutrition intelligence is generated from onboarding inputs:

1. Basic Info
2. Diet Preferences
3. Goal Settings
4. Timeline
5. Lifestyle
6. Daily Meal Schedule

## New Backend Models

- `UserProfile`
- `MealEntry`
- `FoodDatabase`
- `DailyNutrition`

## Nutrition Features Added

- Onboarding wizard persistence to MongoDB
- BMR + maintenance + calorie adjustment + daily goal calculation
- Meal target distribution by schedule
- Global food search (`foodDatabase.json`, thousands of records)
- Gram-based calorie/macro calculations
- Daily meal logging with consumed vs remaining calories
- Meal countdown timers
- Smart nutrition alerts
- Calorie analytics (daily, weekly, surplus/deficit, weight trend)

## Folder Highlights

```text
server/
|-- controllers/
|   `-- nutritionController.js
|-- models/
|   |-- DailyNutrition.js
|   |-- FoodDatabase.js
|   |-- MealEntry.js
|   `-- UserProfile.js
|-- routes/
|   `-- nutritionRoutes.js
|-- utils/
|   |-- nutritionEngine.js
|   `-- seedFoodDatabase.js
`-- data/
    `-- foodDatabase.json

client/src/
|-- pages/
|   |-- OnboardingPage.jsx
|   |-- DashboardPage.jsx
|   |-- DietPlannerPage.jsx
|   |-- ProgressAnalyticsPage.jsx
|   `-- WeightAnalyticsPage.jsx
|-- services/
|   `-- nutritionService.js
`-- features/workspace/
    `-- WorkspaceProvider.jsx
```

## Nutrition API Endpoints

- `GET /api/nutrition/onboarding`
- `POST /api/nutrition/onboarding`
- `GET /api/nutrition/foods/search?q=banana`
- `POST /api/nutrition/meals`
- `GET /api/nutrition/meals?date=YYYY-MM-DD`
- `GET /api/nutrition/dashboard`
- `GET /api/nutrition/analytics`

## Run

1. Install dependencies

```bash
npm install
```

2. Start backend

```bash
npm run server
```

3. Start frontend

```bash
npm start
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

## Notes

- Existing backend AI engines remain in place and are reused.
- Food database is auto-seeded on server boot if needed.
- Onboarding is mandatory before dashboard generation.
