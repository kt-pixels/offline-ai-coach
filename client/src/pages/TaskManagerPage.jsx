import { useMemo, useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import StatCard from '../components/ui/StatCard';

const initialTask = {
  title: '',
  description: '',
  priority: 'medium',
  disciplineArea: 'productivity',
  dueDate: ''
};

function TaskManagerPage() {
  const { dashboard, insights, actions } = useWorkspace();
  const [task, setTask] = useState(initialTask);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const tasks = dashboard?.tasks || [];

  const filteredTasks = useMemo(
    () =>
      tasks.filter((item) => {
        const statusOk =
          statusFilter === 'all' ||
          (statusFilter === 'done' && item.completed) ||
          (statusFilter === 'open' && !item.completed);
        const priorityOk = priorityFilter === 'all' || item.priority === priorityFilter;
        return statusOk && priorityOk;
      }),
    [tasks, statusFilter, priorityFilter]
  );

  const submitTask = async (event) => {
    event.preventDefault();
    if (!task.title.trim()) return;
    await actions.createTask({ ...task, dueDate: task.dueDate || undefined });
    setTask(initialTask);
  };

  const highPriorityOpen = tasks.filter((item) => !item.completed && item.priority === 'high').length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open Tasks" value={tasks.filter((item) => !item.completed).length} hint="Current backlog" tone="blue" />
        <StatCard label="High Priority" value={highPriorityOpen} hint="Needs immediate action" tone="amber" />
        <StatCard
          label="Discipline Score"
          value={`${insights?.behavior?.disciplineScore || 0}/100`}
          hint="Behavior AI score"
          tone="emerald"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form className="glass-card space-y-3 p-4" onSubmit={submitTask}>
          <p className="panel-title">Create Task</p>
          <input
            className="input-base"
            placeholder="Task title"
            value={task.title}
            onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="input-base"
            rows={3}
            placeholder="Description"
            value={task.description}
            onChange={(e) => setTask((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="input-base"
              value={task.priority}
              onChange={(e) => setTask((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              className="input-base"
              value={task.disciplineArea}
              onChange={(e) => setTask((prev) => ({ ...prev, disciplineArea: e.target.value }))}
            >
              <option value="productivity">Productivity</option>
              <option value="fitness">Fitness</option>
              <option value="diet">Diet</option>
              <option value="mindset">Mindset</option>
            </select>
            <input
              className="input-base"
              type="date"
              value={task.dueDate}
              onChange={(e) => setTask((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <button className="btn-primary" type="submit">
            Add Task
          </button>
        </form>

        <section className="glass-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="panel-title">Task Filters</p>
            <div className="flex gap-2">
              <select className="input-base !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="done">Done</option>
              </select>
              <select className="input-base !w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {filteredTasks.map((item) => (
              <article key={item._id} className="rounded-xl border border-slate-700 bg-panel-950/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-medium ${item.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.priority} priority | {item.disciplineArea}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-subtle" type="button" onClick={() => actions.toggleTask(item._id)}>
                      {item.completed ? 'Reopen' : 'Done'}
                    </button>
                    <button className="btn-subtle" type="button" onClick={() => actions.deleteTask(item._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!filteredTasks.length ? <p className="text-sm text-slate-500">No tasks match current filters.</p> : null}
          </div>
        </section>
      </section>
    </div>
  );
}

export default TaskManagerPage;
