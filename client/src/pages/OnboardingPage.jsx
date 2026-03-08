import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import * as nutritionService from '../services/nutritionService';

const totalSteps = 6;

const stepTitles = [
  'Basic Info',
  'Diet Preferences',
  'Goal Settings',
  'Timeline',
  'Lifestyle',
  'Daily Schedule'
];

const initialForm = {
  age: '',
  gender: 'male',
  heightCm: '',
  currentWeightKg: '',
  targetWeightKg: '',
  dietPreference: 'vegetarian',
  goalSetting: 'weight_gain',
  timelinePreference: 'moderate',
  activityLevel: 'moderate',
  workoutDaysPerWeek: '3',
  sleepTime: '23:00',
  mealFrequency: '5',
  breakfastTime: '08:00',
  snackTime: '11:00',
  lunchTime: '14:00',
  eveningSnackTime: '17:00',
  dinnerTime: '21:00'
};

function StepBasic({ form, setForm }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Age</span>
        <input className="input-base" type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
      </label>
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Gender</span>
        <select className="input-base" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Height (cm)</span>
        <input
          className="input-base"
          type="number"
          value={form.heightCm}
          onChange={(e) => setForm((p) => ({ ...p, heightCm: e.target.value }))}
        />
      </label>
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Current Weight (kg)</span>
        <input
          className="input-base"
          type="number"
          value={form.currentWeightKg}
          onChange={(e) => setForm((p) => ({ ...p, currentWeightKg: e.target.value }))}
        />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Target Weight (kg)</span>
        <input
          className="input-base"
          type="number"
          value={form.targetWeightKg}
          onChange={(e) => setForm((p) => ({ ...p, targetWeightKg: e.target.value }))}
        />
      </label>
    </div>
  );
}

function StepDiet({ form, setForm }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[
        ['vegetarian', 'Vegetarian'],
        ['vegan', 'Vegan'],
        ['non-vegetarian', 'Non-Vegetarian'],
        ['eggetarian', 'Eggetarian']
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setForm((p) => ({ ...p, dietPreference: value }))}
          className={`rounded-xl border p-4 text-left ${
            form.dietPreference === value
              ? 'border-linear-500 bg-linear-500/15 text-slate-100'
              : 'border-slate-700 bg-panel-950/60 text-slate-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function StepGoal({ form, setForm }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[
        ['weight_gain', 'Weight Gain'],
        ['muscle_gain', 'Muscle Gain'],
        ['weight_loss', 'Weight Loss']
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setForm((p) => ({ ...p, goalSetting: value }))}
          className={`rounded-xl border p-4 text-left ${
            form.goalSetting === value
              ? 'border-linear-500 bg-linear-500/15 text-slate-100'
              : 'border-slate-700 bg-panel-950/60 text-slate-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function StepTimeline({ form, setForm }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">How quickly do you want to reach your target weight?</p>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ['aggressive', 'Aggressive'],
          ['moderate', 'Moderate'],
          ['slow', 'Slow']
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setForm((p) => ({ ...p, timelinePreference: value }))}
            className={`rounded-xl border p-4 text-left ${
              form.timelinePreference === value
                ? 'border-linear-500 bg-linear-500/15 text-slate-100'
                : 'border-slate-700 bg-panel-950/60 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepLifestyle({ form, setForm }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Activity Level</span>
        <select
          className="input-base"
          value={form.activityLevel}
          onChange={(e) => setForm((p) => ({ ...p, activityLevel: e.target.value }))}
        >
          <option value="sedentary">Sedentary</option>
          <option value="light">Lightly Active</option>
          <option value="moderate">Moderately Active</option>
          <option value="high">Highly Active</option>
          <option value="athlete">Athlete</option>
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Workout Days / Week</span>
        <input
          className="input-base"
          type="number"
          min="0"
          max="7"
          value={form.workoutDaysPerWeek}
          onChange={(e) => setForm((p) => ({ ...p, workoutDaysPerWeek: e.target.value }))}
        />
      </label>
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Sleep Time</span>
        <input
          className="input-base"
          type="time"
          value={form.sleepTime}
          onChange={(e) => setForm((p) => ({ ...p, sleepTime: e.target.value }))}
        />
      </label>
      <label>
        <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Meal Frequency</span>
        <input
          className="input-base"
          type="number"
          min="3"
          max="6"
          value={form.mealFrequency}
          onChange={(e) => setForm((p) => ({ ...p, mealFrequency: e.target.value }))}
        />
      </label>
    </div>
  );
}

function StepSchedule({ form, setForm }) {
  const fields = [
    ['breakfastTime', 'Breakfast Time'],
    ['snackTime', 'Snack Time'],
    ['lunchTime', 'Lunch Time'],
    ['eveningSnackTime', 'Evening Snack Time'],
    ['dinnerTime', 'Dinner Time']
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map(([key, label]) => (
        <label key={key}>
          <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">{label}</span>
          <input
            className="input-base"
            type="time"
            value={form[key]}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          />
        </label>
      ))}
    </div>
  );
}

function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const progress = useMemo(() => Math.round((step / totalSteps) * 100), [step]);

  if (user?.onboardingCompleted) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const next = () => setStep((prev) => Math.min(totalSteps, prev + 1));
  const prev = () => setStep((prev) => Math.max(1, prev - 1));

  const submit = async () => {
    setSaving(true);
    setError('');

    try {
      await nutritionService.saveOnboarding(form);
      await refreshUser();
      navigate('/app/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save onboarding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-shell-gradient px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="glass-card p-6">
          <p className="panel-title">Onboarding</p>
          <h1 className="mt-1 font-sans text-2xl font-semibold text-slate-100">Personal Nutrition Intelligence Setup</h1>
          <p className="mt-2 text-sm text-slate-400">All recommendations will be generated only from your inputs.</p>

          <div className="mt-5 h-2 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-gradient-to-r from-linear-500 to-accent-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-4 text-sm text-slate-300">
            Step {step} of {totalSteps}: <span className="font-medium">{stepTitles[step - 1]}</span>
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="mt-6">
            {step === 1 ? <StepBasic form={form} setForm={setForm} /> : null}
            {step === 2 ? <StepDiet form={form} setForm={setForm} /> : null}
            {step === 3 ? <StepGoal form={form} setForm={setForm} /> : null}
            {step === 4 ? <StepTimeline form={form} setForm={setForm} /> : null}
            {step === 5 ? <StepLifestyle form={form} setForm={setForm} /> : null}
            {step === 6 ? <StepSchedule form={form} setForm={setForm} /> : null}
          </motion.div>

          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

          <div className="mt-6 flex items-center justify-between">
            <button className="btn-subtle" type="button" onClick={prev} disabled={step === 1 || saving}>
              Back
            </button>
            {step < totalSteps ? (
              <button className="btn-primary" type="button" onClick={next}>
                Continue
              </button>
            ) : (
              <button className="btn-primary" type="button" onClick={submit} disabled={saving}>
                {saving ? 'Saving...' : 'Complete Onboarding'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
