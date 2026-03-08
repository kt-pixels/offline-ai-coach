import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useWorkspace } from "../hooks/useWorkspace";
import ChartCard from "../components/ui/ChartCard";
import ProgressRing from "../components/ui/ProgressRing";
import StatCard from "../components/ui/StatCard";

function buildMealTiming(profile) {
  return {
    breakfastTime: profile?.dailySchedule?.breakfastTime || "08:00",
    snackTime: profile?.dailySchedule?.snackTime || "11:00",
    lunchTime: profile?.dailySchedule?.lunchTime || "14:00",
    eveningSnackTime: profile?.dailySchedule?.eveningSnackTime || "17:00",
    dinnerTime: profile?.dailySchedule?.dinnerTime || "21:00",
  };
}

function DietPlannerPage() {
  const { nutritionDashboard, actions } = useWorkspace();
  const today = nutritionDashboard?.today;
  const profile = nutritionDashboard?.profile;
  const mealDistribution = today?.mealDistribution || [];
  const defaultMealPlan = nutritionDashboard?.mealPlan;

  const [mealType, setMealType] = useState("breakfast");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState("100");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [mealPlan, setMealPlan] = useState(defaultMealPlan);
  const [planForm, setPlanForm] = useState({
    calorieTarget:
      defaultMealPlan?.calorieTarget || today?.calorieTarget || 2400,
    dietType: profile?.dietPreference || "vegetarian",
    mealTiming: buildMealTiming(profile),
  });
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    setMealPlan(defaultMealPlan);
    setPlanForm({
      calorieTarget:
        defaultMealPlan?.calorieTarget || today?.calorieTarget || 2400,
      dietType: profile?.dietPreference || "vegetarian",
      mealTiming: buildMealTiming(profile),
    });
  }, [defaultMealPlan, today?.calorieTarget, profile]);

  useEffect(() => {
    let active = true;

    async function runSearch() {
      try {
        setLoadingSearch(true);
        const data = await actions.searchFoods(
          searchTerm.trim(),
          searchTerm.trim() ? 12 : 8,
          mealType,
        );
        if (active) {
          setSearchResults(data.foods || []);
        }
      } catch (error) {
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setLoadingSearch(false);
        }
      }
    }

    const timer = setTimeout(runSearch, searchTerm.trim() ? 220 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, mealType, actions]);

  const calculated = useMemo(() => {
    if (!selectedFood) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const qty = Number(grams || 0);
    return {
      calories: Math.round(qty * selectedFood.calories_per_gram),
      protein: Math.round(qty * selectedFood.protein_per_gram),
      carbs: Math.round(qty * selectedFood.carbs_per_gram),
      fat: Math.round(qty * selectedFood.fat_per_gram),
    };
  }, [selectedFood, grams]);

  const addFoodToMeal = async () => {
    if (!selectedFood || !grams) return;

    setSaving(true);
    setMessage("");

    try {
      await actions.addMealEntry({
        mealType,
        foodId: selectedFood.id,
        grams: Number(grams),
      });
      setMessage(
        `${selectedFood.name} added to ${mealType.replaceAll("_", " ")}.`,
      );
      setSearchTerm("");
      setSelectedFood(null);
      setSearchResults([]);
      setGrams("100");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Unable to log meal entry.");
    } finally {
      setSaving(false);
    }
  };

  const regenerateMealPlan = async (event) => {
    event.preventDefault();
    setRegenerating(true);
    setMessage("");

    try {
      const data = await actions.generateMealPlan(planForm);
      setMealPlan(data.mealPlan);
      setMessage("AI meal plan regenerated from the local food database.");
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to generate a meal plan right now.",
      );
    } finally {
      setRegenerating(false);
    }
  };

  const calorieProgress = today?.calorieTarget
    ? Math.min(
        100,
        Math.round((today.caloriesConsumed / today.calorieTarget) * 100),
      )
    : 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 px-3 py-4 sm:space-y-5 sm:px-5 sm:py-5 lg:space-y-6 lg:px-8 lg:py-6 xl:px-10">
      {/* Stats Row */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Daily Intake"
          value={`${today?.caloriesConsumed || 0} kcal`}
          hint={`Target ${today?.calorieTarget || 0} kcal`}
          tone="blue"
        />
        <StatCard
          label="Meal Plan Total"
          value={`${mealPlan?.totalCalories || 0} kcal`}
          hint={mealPlan?.dietType || "diet plan"}
          tone="emerald"
        />
        <StatCard
          label="Protein Coverage"
          value={`${Math.round(mealPlan?.macros?.protein || today?.proteinConsumed || 0)} g`}
          hint="Generated + logged"
          tone="amber"
        />
        <StatCard
          label="Shopping Items"
          value={`${mealPlan?.shoppingList?.length || 0}`}
          hint="Auto grouped by the AI planner"
          tone="rose"
        />
      </section>

      {/* Main Two-Column Section */}
      <section className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:gap-6">
        {/* Smart Food Search */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 sm:p-5 lg:p-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between">
            <div className="min-w-0 flex-1">
              <p className="panel-title">Smart Food Search</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                Search by food name, choose grams, and the system calculates
                nutrition instantly.
              </p>
            </div>
            <div className="flex justify-start min-[480px]:justify-end shrink-0">
              <ProgressRing
                value={today?.caloriesConsumed || 0}
                max={today?.calorieTarget || 1}
                label="Daily Intake"
              />
            </div>
          </div>

          {/* Search Controls */}
          <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <label className="w-full">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Meal
              </span>
              <select
                className="input-base w-full"
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
              >
                <option value="breakfast">Breakfast</option>
                <option value="mid_morning_snack">Mid Morning Snack</option>
                <option value="lunch">Lunch</option>
                <option value="evening_snack">Evening Snack</option>
                <option value="dinner">Dinner</option>
              </select>
            </label>

            <label className="w-full min-[480px]:col-span-1 sm:col-span-2 lg:col-span-2">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Food Search
              </span>
              <input
                className="input-base w-full"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSelectedFood(null);
                }}
                placeholder="Search foods or leave blank for popular picks"
              />
              {loadingSearch ? (
                <p className="mt-2 text-xs text-slate-500">
                  Searching local database...
                </p>
              ) : null}
              <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto pr-1 sm:max-h-72">
                {searchResults.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => {
                      setSelectedFood(food);
                      setSearchTerm(food.name);
                    }}
                    className={`group w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-200 sm:px-4 sm:py-3 ${
                      selectedFood?.id === food.id
                        ? "border-linear-500 bg-linear-500/10 shadow-lg shadow-linear-500/10"
                        : "border-slate-700 bg-panel-950/60 hover:border-slate-500 hover:bg-panel-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-100 group-hover:text-white sm:text-sm">
                          {food.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {food.category} • {food.cuisine}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300 sm:px-3 sm:py-1">
                          {Math.round(food.calories_per_gram * 100)} kcal
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </label>

            <label className="w-full">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Quantity (g)
              </span>
              <input
                className="input-base w-full"
                type="number"
                min="1"
                value={grams}
                onChange={(event) => setGrams(event.target.value)}
              />
            </label>
          </div>

          {/* Nutrition Preview + Progress */}
          <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">
            <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300 sm:p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Nutrition Preview
              </p>
              <p className="mt-2.5 text-lg font-semibold text-slate-50 sm:text-xl lg:text-2xl">
                {calculated.calories} kcal
              </p>
              <p className="mt-1.5 text-xs leading-relaxed sm:text-sm">
                P {calculated.protein}g &nbsp;•&nbsp; C {calculated.carbs}g
                &nbsp;•&nbsp; F {calculated.fat}g
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300 sm:p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Daily Progress
              </p>
              <p className="mt-2.5 text-lg font-semibold text-slate-50 sm:text-xl lg:text-2xl">
                {calorieProgress}%
              </p>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-linear-500 to-accent-500 transition-all duration-500"
                  style={{ width: `${calorieProgress}%` }}
                />
              </div>
            </div>
          </div>

          <button
            className="btn-primary mt-4 w-full sm:w-auto"
            type="button"
            onClick={addFoodToMeal}
            disabled={!selectedFood || saving}
          >
            {saving ? "Saving..." : "Save Meal Entry"}
          </button>
        </motion.section>

        {/* AI Meal Generator */}
        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card space-y-4 p-4 sm:p-5 lg:p-6"
          onSubmit={regenerateMealPlan}
        >
          <div>
            <p className="panel-title">AI Meal Generator</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Generate a full daily meal plan from the local food database using
              calories, diet type, and meal timing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">
            <label>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Calorie Target
              </span>
              <input
                className="input-base w-full"
                type="number"
                min="1200"
                value={planForm.calorieTarget}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    calorieTarget: Number(event.target.value || 0),
                  }))
                }
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Diet Type
              </span>
              <select
                className="input-base w-full"
                value={planForm.dietType}
                onChange={(event) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    dietType: event.target.value,
                  }))
                }
              >
                <option value="vegetarian">Veg</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non-vegetarian">Non-Veg</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-3 lg:grid-cols-2">
            {[
              ["breakfastTime", "Breakfast"],
              ["snackTime", "Snack"],
              ["lunchTime", "Lunch"],
              ["eveningSnackTime", "Eve. Snack"],
              ["dinnerTime", "Dinner"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                  {label}
                </span>
                <input
                  className="input-base w-full"
                  type="time"
                  value={planForm.mealTiming[key]}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      mealTiming: {
                        ...prev.mealTiming,
                        [key]: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <button
            className="btn-primary w-full sm:w-auto"
            type="submit"
            disabled={regenerating}
          >
            {regenerating ? "Generating..." : "Regenerate Meal Plan"}
          </button>

          <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300 sm:p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Generated Totals
            </p>
            <p className="mt-2.5 text-lg font-semibold text-slate-50 sm:text-xl lg:text-2xl">
              {mealPlan?.totalCalories || 0} kcal
            </p>
            <p className="mt-1.5 text-xs leading-relaxed sm:text-sm">
              P {Math.round(mealPlan?.macros?.protein || 0)}g &nbsp;•&nbsp; C{" "}
              {Math.round(mealPlan?.macros?.carbs || 0)}g &nbsp;•&nbsp; F{" "}
              {Math.round(mealPlan?.macros?.fat || 0)}g
            </p>
          </div>
        </motion.form>
      </section>

      {/* Meal Plan Cards */}
      <section className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-2">
        {(mealPlan?.meals || []).map((meal) => (
          <ChartCard
            key={meal.mealType}
            title={meal.label}
            subtitle={`${meal.time || "--:--"} • ${meal.totalCalories}/${meal.targetCalories} kcal`}
          >
            <div className="space-y-2 sm:space-y-3">
              {(meal.foods || []).map((food) => (
                <div
                  key={`${meal.mealType}-${food.name}`}
                  className="rounded-xl border border-slate-700 bg-panel-950/60 p-2.5 text-sm text-slate-300 sm:rounded-2xl sm:p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-100 sm:text-sm">
                      {food.name}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {food.grams}g
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    {food.calories} kcal • P {food.protein}g • C {food.carbs}g •
                    F {food.fat}g
                  </p>
                </div>
              ))}
              <p className="text-xs leading-relaxed text-slate-500">
                {meal.guidance}
              </p>
            </div>
          </ChartCard>
        ))}
      </section>

      {/* Meal Distribution */}
      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {mealDistribution.map((meal) => {
          const progress = meal.targetCalories
            ? Math.min(
                100,
                Math.round((meal.consumedCalories / meal.targetCalories) * 100),
              )
            : 0;

          return (
            <div key={meal.mealType} className="glass-card p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">
                  {meal.label}
                </p>
                <button
                  className="btn-subtle shrink-0"
                  type="button"
                  onClick={() => setMealType(meal.mealType)}
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {meal.scheduledTime}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-linear-500 to-accent-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-xs leading-relaxed text-slate-400">
                <span>Target {meal.targetCalories}</span>
                <span className="mx-1 text-slate-600">•</span>
                <span>Consumed {meal.consumedCalories}</span>
                <span className="mx-1 text-slate-600">•</span>
                <span>Remaining {meal.remainingCalories}</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {(meal.foodsConsumed || []).slice(0, 5).map((food) => (
                  <div
                    key={food.id}
                    className="rounded-lg border border-slate-700 bg-panel-950/60 p-2 text-xs text-slate-300"
                  >
                    <span className="font-medium text-slate-200">
                      {food.name}
                    </span>
                    <span className="text-slate-500">
                      {" "}
                      • {food.grams}g • {food.calories} kcal
                    </span>
                  </div>
                ))}
                {!meal.foodsConsumed?.length ? (
                  <p className="text-xs text-slate-500 italic">
                    No foods logged yet.
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      {message ? (
        <div className="rounded-xl border border-slate-700 bg-panel-950/60 px-4 py-3">
          <p className="text-sm leading-relaxed text-slate-300">{message}</p>
        </div>
      ) : null}
    </div>
  );
}

export default DietPlannerPage;
