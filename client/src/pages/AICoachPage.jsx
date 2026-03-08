import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import CoachMessage from '../components/ui/CoachMessage';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function AICoachPage() {
  const { insights, nutritionDashboard, actions } = useWorkspace();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'assistant',
      content: 'I am your local AI coach. Ask about calories, discipline, workouts, habits, meals, or future bodyweight.',
      timestamp: nowTime(),
    },
  ]);

  useEffect(() => {
    if (!insights?.coachFeed?.length) return;
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].id !== 'init') {
        return prev;
      }

      return [
        {
          id: 'init',
          role: 'assistant',
          content: insights.coachFeed[0],
          timestamp: nowTime(),
        },
      ];
    });
  }, [insights?.coachFeed]);

  const quickPrompts = useMemo(
    () => [
      'How do I hit my calorie target today?',
      'What is hurting my discipline score?',
      'Show my weight projection for the next 12 weeks.',
      'Build my best next meal.',
    ],
    [],
  );

  const send = async (text) => {
    const clean = text.trim();
    if (!clean || pending) return;

    const userMsg = { id: `${Date.now()}-u`, role: 'user', content: clean, timestamp: nowTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPending(true);
    setError('');

    try {
      const data = await actions.coachChat(clean);
      const assistantMsg = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: data.reply,
        timestamp: nowTime(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to reach the local coach engine.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <section className="glass-card flex h-[74vh] flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="panel-title">Conversational AI Coach</p>
            <p className="mt-1 text-sm text-slate-400">Offline chat powered by your local nutrition, habit, workout, and weight data.</p>
          </div>
          <span className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400">Local Engine</span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {messages.map((message) => (
            <CoachMessage key={message.id} role={message.role} content={message.content} timestamp={message.timestamp} />
          ))}
          {pending ? <CoachMessage role="assistant" content="Analyzing your local fitness graph..." timestamp={nowTime()} /> : null}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button key={prompt} className="btn-subtle" type="button" onClick={() => send(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <input
              className="input-base"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about diet, progress, discipline, or future simulation"
            />
            <button className="btn-primary" type="submit" disabled={pending}>
              Send
            </button>
          </form>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <StatCard label="Discipline Score" value={`${insights?.behavior?.disciplineScore || 0}/100`} hint={insights?.behavior?.label || 'behavior engine'} tone="emerald" />
          <StatCard label="Failure Risk" value={`${insights?.behavior?.failureRisk || 0}%`} hint={`Workout skip streak ${insights?.behavior?.workoutSkipStreak || 0} days`} tone="rose" />
        </div>

        <ChartCard title="Coach Signals" subtitle="What the engine is seeing right now">
          <div className="space-y-2 text-sm text-slate-300">
            {(insights?.coachFeed || insights?.suggestions || []).slice(0, 5).map((suggestion) => (
              <div key={suggestion} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3">
                {suggestion}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Discipline Components" subtitle="Where your score is being won or lost">
          <div className="space-y-3">
            {Object.entries(insights?.behavior?.components || {}).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span className="capitalize">{key.replaceAll(/([A-Z])/g, ' $1')}</span>
                  <span>{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-gradient-to-r from-linear-500 to-accent-500" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Weight Projection" subtitle="Key milestones from the growth predictor">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {(insights?.progress?.milestones || []).map((point) => (
              <div key={point.week} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{point.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{point.weightKg} kg</p>
                <p className="mt-1 text-xs text-slate-500">Weekly change {point.weeklyChangeKg} kg</p>
              </div>
            ))}
            {!insights?.progress?.milestones?.length ? <p className="text-sm text-slate-500">Projection will appear after onboarding.</p> : null}
          </div>
        </ChartCard>

        <ChartCard title="Meal Plan Snapshot" subtitle="Current AI-generated daily plan">
          <div className="space-y-3 text-sm text-slate-300">
            {(nutritionDashboard?.mealPlan?.meals || []).slice(0, 3).map((meal) => (
              <div key={meal.mealType} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3">
                <p className="font-medium text-slate-100">{meal.label}</p>
                <p className="mt-1 text-xs text-slate-500">{meal.foods.slice(0, 3).map((food) => food.name).join(', ')}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>
    </div>
  );
}

export default AICoachPage;

