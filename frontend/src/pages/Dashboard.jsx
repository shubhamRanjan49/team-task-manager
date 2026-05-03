import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#4f6ef7', '#38bdf8', '#22c55e', '#f59e0b', '#ec4899', '#a78bfa'];

function StatCard({ icon, value, label, color }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function statusBadge(status) {
  const map = {
    'To Do': 'badge badge-todo',
    'In Progress': 'badge badge-progress',
    'Done': 'badge badge-done'
  };
  return map[status] || 'badge badge-todo';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;

  const maxTasksPerUser = stats?.tasksPerUser?.length
    ? Math.max(...stats.tasksPerUser.map((u) => u.count))
    : 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good to see you, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon="📋" value={stats?.totalTasks ?? 0} label="Total Tasks" />
        <StatCard icon="🗂️" value={stats?.totalProjects ?? 0} label="Projects" />
        <StatCard icon="👤" value={stats?.myTasksCount ?? 0} label="My Tasks" color="#4f6ef7" />
        <StatCard icon="⚠️" value={stats?.overdueTasks ?? 0} label="Overdue" color={stats?.overdueTasks > 0 ? '#ef4444' : undefined} />
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Tasks by status */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Tasks by Status</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'To Do', key: 'To Do', color: '#6b7280', dot: 'dot-todo' },
              { label: 'In Progress', key: 'In Progress', color: '#38bdf8', dot: 'dot-progress' },
              { label: 'Done', key: 'Done', color: '#22c55e', dot: 'dot-done' }
            ].map(({ label, key, color, dot }) => {
              const count = stats?.tasksByStatus?.[key] ?? 0;
              const total = stats?.totalTasks || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span className={`kanban-dot ${dot}`} />
                      {label}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} <span style={{ fontSize: 11 }}>({pct}%)</span></span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks per user */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Tasks per User</span>
          </div>
          {stats?.tasksPerUser?.length ? (
            <div className="bar-chart">
              {stats.tasksPerUser.slice(0, 6).map((u, i) => (
                <div key={u.name} className="bar-row">
                  <span className="bar-label">{u.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(u.count / maxTasksPerUser) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="bar-count">{u.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No assigned tasks yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Recent Tasks</span>
          <Link to="/projects" className="btn btn-ghost btn-sm">View Projects →</Link>
        </div>
        {stats?.recentTasks?.length ? (
          <div>
            {stats.recentTasks.map((task) => {
              const overdue = task.status !== 'Done' && isPast(new Date(task.dueDate));
              return (
                <div key={task._id} className="task-card">
                  <div className="task-card-header">
                    <span className="task-title">{task.title}</span>
                    <div className="task-badges">
                      <span className={statusBadge(task.status)}>{task.status}</span>
                    </div>
                  </div>
                  <div className="task-meta">
                    <span className="task-meta-item">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project?.color || '#4f6ef7', display: 'inline-block' }} />
                      {task.project?.name}
                    </span>
                    {task.assignedTo && (
                      <span className="task-meta-item">👤 {task.assignedTo.name}</span>
                    )}
                    <span className="task-meta-item" style={{ color: overdue ? 'var(--danger)' : undefined }}>
                      📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      {overdue && ' • Overdue'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No tasks yet</div>
            <div className="empty-state-text">Create a project and add tasks to get started</div>
          </div>
        )}
      </div>
    </div>
  );
}
