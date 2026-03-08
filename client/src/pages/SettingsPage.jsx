import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import * as authService from '../services/authService';

function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { dashboard, refresh } = useWorkspace();

  const [form, setForm] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    goalWeight: '',
    dietPreference: 'vegetarian',
    budget: '',
    fitnessLevel: 'beginner'
  });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const profile = dashboard?.profile || user;
    if (!profile) return;

    setForm({
      name: profile.name || '',
      age: profile.age || '',
      height: profile.height || '',
      weight: profile.weight || '',
      goalWeight: profile.goalWeight || '',
      dietPreference: profile.dietPreference || 'vegetarian',
      budget: profile.budget || '',
      fitnessLevel: profile.fitnessLevel || 'beginner'
    });
  }, [dashboard?.profile, user]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      await authService.updateProfile(form);
      await refreshUser();
      await refresh();
      setStatus('Settings updated.');
    } catch (err) {
      setStatus(err?.response?.data?.message || 'Unable to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <section className="glass-card p-4">
        <p className="panel-title">Workspace Settings</p>
        <p className="mt-1 text-sm text-slate-400">Update account-level fields. For nutrition logic changes, re-run onboarding.</p>

        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Name</label>
              <input className="input-base" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Age</label>
              <input className="input-base" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Height (cm)</label>
              <input className="input-base" value={form.height} onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Weight (kg)</label>
              <input className="input-base" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Goal Weight (kg)</label>
              <input className="input-base" value={form.goalWeight} onChange={(e) => setForm((p) => ({ ...p, goalWeight: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Daily Budget</label>
              <input className="input-base" value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Diet Preference</label>
              <select className="input-base" value={form.dietPreference} onChange={(e) => setForm((p) => ({ ...p, dietPreference: e.target.value }))}>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non-vegetarian">Non-vegetarian</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase text-slate-400">Fitness Level</label>
              <select className="input-base" value={form.fitnessLevel} onChange={(e) => setForm((p) => ({ ...p, fitnessLevel: e.target.value }))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button className="btn-primary" disabled={saving} type="submit">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {status ? <p className="text-sm text-slate-300">{status}</p> : null}
        </form>
      </section>
    </div>
  );
}

export default SettingsPage;
