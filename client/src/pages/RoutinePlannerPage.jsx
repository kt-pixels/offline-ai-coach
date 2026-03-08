import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../hooks/useWorkspace';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function RoutinePlannerPage() {
  const { nutritionDashboard, planningOverview, actions } = useWorkspace();
  const profile = nutritionDashboard?.profile;
  const [form, setForm] = useState({
    wakeTime: '07:00',
    workStart: '09:00',
    workEnd: '18:00',
    breakfastTime: profile?.dailySchedule?.breakfastTime || '08:00',
    lunchTime: profile?.dailySchedule?.lunchTime || '13:30',
    dinnerTime: profile?.dailySchedule?.dinnerTime || '21:00',
    snackTime: profile?.dailySchedule?.eveningSnackTime || '17:00',
    sleepTime: profile?.lifestyle?.sleepTime || '23:00',
  });
  const [workoutDays, setWorkoutDays] = useState(planningOverview?.routine?.selectedWorkoutDays || ['Monday', 'Wednesday', 'Friday']);
  const [routine, setRoutine] = useState(planningOverview?.routine || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setRoutine(planningOverview?.routine || null);
    if (planningOverview?.routine?.selectedWorkoutDays?.length) {
      setWorkoutDays(planningOverview.routine.selectedWorkoutDays);
    }
  }, [planningOverview?.routine]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      breakfastTime: profile?.dailySchedule?.breakfastTime || prev.breakfastTime,
      lunchTime: profile?.dailySchedule?.lunchTime || prev.lunchTime,
      dinnerTime: profile?.dailySchedule?.dinnerTime || prev.dinnerTime,
      snackTime: profile?.dailySchedule?.eveningSnackTime || prev.snackTime,
      sleepTime: profile?.lifestyle?.sleepTime || prev.sleepTime,
    }));
  }, [profile]);

  const toggleDay = (day) => {
    setWorkoutDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
  };

  const generateRoutine = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await actions.generateRoutine({
        wakeTime: form.wakeTime,
        workHours: { start: form.workStart, end: form.workEnd },
        mealSchedule: {
          breakfastTime: form.breakfastTime,
          lunchTime: form.lunchTime,
          dinnerTime: form.dinnerTime,
          snackTime: form.snackTime,
          eveningSnackTime: form.snackTime,
        },
        workoutDays,
        sleepTime: form.sleepTime,
      });
      setRoutine(data.routine);
      setMessage('Routine regenerated from your wake, work, meal, workout, and sleep schedule.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to generate routine.');
    } finally {
      setLoading(false);
    }
  };

  const todayItems = useMemo(() => routine?.todayPlan?.items || [], [routine?.todayPlan?.items]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Wake Time" value={routine?.wakeTime || form.wakeTime} hint="Daily starting anchor" tone="blue" />
        <StatCard label="Sleep Time" value={routine?.sleepTime || form.sleepTime} hint="Recovery anchor" tone="emerald" />
        <StatCard label="Workout Days" value={`${routine?.selectedWorkoutDays?.length || workoutDays.length}`} hint="Structured across the week" tone="amber" />
        <StatCard label="Discipline Score" value={`${routine?.disciplineScore || 0}/100`} hint="Routine consistency signal" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-4 p-4" onSubmit={generateRoutine}>
          <div>
            <p className="panel-title">Routine Builder</p>
            <p className="mt-1 text-sm text-slate-400">Design a daily operating system around wake time, work blocks, meal anchors, workout days, and sleep.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['wakeTime', 'Wake Time'],
              ['workStart', 'Work Start'],
              ['workEnd', 'Work End'],
              ['breakfastTime', 'Breakfast'],
              ['lunchTime', 'Lunch'],
              ['snackTime', 'Snack'],
              ['dinnerTime', 'Dinner'],
              ['sleepTime', 'Sleep'],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="mb-1 block text-xs uppercase text-slate-400">{label}</span>
                <input className="input-base" type="time" value={form[key]} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))} />
              </label>
            ))}
          </div>

          <div>
            <span className="mb-2 block text-xs uppercase text-slate-400">Workout Days</span>
            <div className="grid gap-2 md:grid-cols-4">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-xl border px-3 py-2 text-sm ${workoutDays.includes(day) ? 'border-linear-500 bg-linear-500/10 text-slate-100' : 'border-slate-700 bg-panel-950/60 text-slate-400'}`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Building...' : 'Generate Routine'}
          </button>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          <ChartCard title="Routine Summary" subtitle={routine?.routineSummary || 'Generate a routine to see the structure.'}>
            <div className="space-y-3">
              {todayItems.map((item) => (
                <div key={`${item.time}-${item.label}`} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300">
                  <span>{item.label}</span>
                  <span className="font-medium text-slate-100">{item.time}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {routine?.nextAction ? (
            <ChartCard title="Next Anchor" subtitle="The next routine checkpoint from the current daily flow">
              <div className="rounded-2xl border border-slate-700 bg-panel-950/60 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Next Action</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{routine.nextAction.label}</p>
                <p className="mt-1 text-slate-400">{routine.nextAction.time}</p>
              </div>
            </ChartCard>
          ) : null}
        </motion.div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {(routine?.days || []).map((day) => (
          <ChartCard key={day.day} title={day.day} subtitle={day.isWorkoutDay ? 'Workout day' : 'Recovery day'}>
            <div className="space-y-3">
              {day.items.map((item) => (
                <div key={`${day.day}-${item.time}-${item.label}`} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-panel-950/60 p-3 text-sm text-slate-300">
                  <span>{item.label}</span>
                  <span className="font-medium text-slate-100">{item.time}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        ))}
      </section>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}

export default RoutinePlannerPage;
