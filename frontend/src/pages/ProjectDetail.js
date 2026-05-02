import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#4f6ef7', '#38bdf8', '#22c55e', '#f59e0b', '#ec4899', '#a78bfa', '#f97316', '#14b8a6'];
const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

// ─── Toast ───────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  );
}

// ─── Task Modal (Create / Edit) ───────────────────────────────
function TaskModal({ task, projectId, members, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'To Do',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/tasks/${task._id}`, form);
      } else {
        res = await api.post('/tasks', { ...form, project: projectId });
      }
      onSave(res.data, isEdit);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              style={{ resize: 'vertical' }}
              placeholder="Add more details…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Member Modal ──────────────────────────────────────────
function AddMemberModal({ onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onAdd(email, role);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Member</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Modal ─────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onClose, danger }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <p className="confirm-msg">{message}</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Priority Badge ────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const cls = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[priority] || '';
  return <span className={`badge ${cls}`}>{priority}</span>;
}

// ─── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const cls = { 'To Do': 'badge-todo', 'In Progress': 'badge-progress', 'Done': 'badge-done' }[status] || '';
  return <span className={`badge ${cls}`}>{status}</span>;
}

// ─── Task Card ─────────────────────────────────────────────────
function TaskCard({ task, isAdmin, onEdit, onDelete, onStatusChange }) {
  const overdue = task.status !== 'Done' && isPast(new Date(task.dueDate));

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className="task-title">{task.title}</span>
        <div className="task-actions">
          {(isAdmin || task.assignedTo) && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(task)} title="Edit">✏️</button>
          )}
          {isAdmin && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDelete(task)} title="Delete">🗑️</button>
          )}
        </div>
      </div>

      {task.description && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
          {task.description.length > 80 ? task.description.slice(0, 80) + '…' : task.description}
        </p>
      )}

      <div className="task-badges">
        <PriorityBadge priority={task.priority} />
        {overdue && <span className="badge badge-overdue">Overdue</span>}
      </div>

      <div className="task-meta">
        {task.assignedTo && (
          <span className="task-meta-item">
            <span>👤</span> {task.assignedTo.name}
          </span>
        )}
        <span className="task-meta-item" style={{ color: overdue ? 'var(--danger)' : undefined }}>
          <span>📅</span> {format(new Date(task.dueDate), 'MMM d')}
        </span>
        {isAdmin && (
          <select
            className="form-input btn-sm"
            style={{ padding: '3px 8px', fontSize: 11, marginLeft: 'auto', width: 'auto' }}
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');

  const [taskModal, setTaskModal] = useState(null); // null | 'create' | task object
  const [addMember, setAddMember] = useState(false);
  const [confirm, setConfirm] = useState(null); // {title, message, onConfirm, danger}
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const myRole = project?.members?.find(
    (m) => m.user?._id === user?._id || m.user?.toString() === user?._id
  )?.role;
  const isAdmin = myRole === 'Admin';

  const fetchProject = useCallback(() => {
    api.get(`/projects/${id}`).then((res) => setProject(res.data)).catch(() => navigate('/projects'));
  }, [id, navigate]);

  const fetchTasks = useCallback(() => {
    api.get(`/tasks/project/${id}`).then((res) => setTasks(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`)
    ]).then(([p, t]) => {
      setProject(p.data);
      setTasks(t.data);
    }).catch(() => navigate('/projects')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSaveTask = (savedTask, isEdit) => {
    if (isEdit) {
      setTasks((prev) => prev.map((t) => (t._id === savedTask._id ? savedTask : t)));
    } else {
      setTasks((prev) => [savedTask, ...prev]);
    }
    showToast(isEdit ? 'Task updated!' : 'Task created!');
  };

  const handleDeleteTask = (task) => {
    setConfirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/tasks/${task._id}`);
          setTasks((prev) => prev.filter((t) => t._id !== task._id));
          showToast('Task deleted');
        } catch {
          showToast('Failed to delete task', 'error');
        }
        setConfirm(null);
      }
    });
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleAddMember = async (email, role) => {
    const res = await api.post(`/projects/${id}/members`, { email, role });
    setProject(res.data);
    showToast(`Member added as ${role}`);
  };

  const handleRemoveMember = (member) => {
    setConfirm({
      title: 'Remove Member',
      message: `Remove ${member.user.name} from this project?`,
      danger: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/projects/${id}/members/${member.user._id}`);
          setProject(res.data);
          showToast('Member removed');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to remove member', 'error');
        }
        setConfirm(null);
      }
    });
  };

  const handleDeleteProject = () => {
    setConfirm({
      title: 'Delete Project',
      message: `This will permanently delete "${project.name}" and all its tasks. This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/projects/${id}`);
          navigate('/projects');
        } catch {
          showToast('Failed to delete project', 'error');
          setConfirm(null);
        }
      }
    });
  };

  if (loading) return <div className="loading-box"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const dotClass = { 'To Do': 'dot-todo', 'In Progress': 'dot-progress', 'Done': 'dot-done' };

  const avatarColor = (i) => {
    const palette = ['#4f6ef7', '#38bdf8', '#22c55e', '#f59e0b', '#ec4899', '#a78bfa'];
    return palette[i % palette.length];
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setTaskModal('create')}>+ Task</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setAddMember(true)}>+ Member</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>
            </>
          )}
          <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>{myRole}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
          📋 Tasks ({tasks.length})
        </button>
        <button className={`tab-btn ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
          👥 Members ({project.members.length})
        </button>
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No tasks yet</div>
              <div className="empty-state-text">
                {isAdmin ? 'Create your first task to get started' : 'No tasks have been created yet'}
              </div>
              {isAdmin && (
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTaskModal('create')}>
                  Create First Task
                </button>
              )}
            </div>
          ) : (
            <div className="kanban">
              {STATUSES.map((status) => (
                <div key={status} className="kanban-col">
                  <div className="kanban-col-header">
                    <span>
                      <span className={`kanban-dot ${dotClass[status]}`} />
                      {status}
                    </span>
                    <span className="kanban-count">{tasksByStatus[status].length}</span>
                  </div>
                  <div className="kanban-body">
                    {tasksByStatus[status].length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 24, fontSize: 12, color: 'var(--text-muted)' }}>
                        No tasks
                      </div>
                    ) : (
                      tasksByStatus[status].map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          isAdmin={isAdmin}
                          onEdit={(t) => setTaskModal(t)}
                          onDelete={handleDeleteTask}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <span className="section-title">{project.members.length} Member{project.members.length !== 1 ? 's' : ''}</span>
            {isAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => setAddMember(true)}>+ Add Member</button>
            )}
          </div>
          <div className="members-list">
            {project.members.map((m, i) => (
              <div key={m.user._id} className="member-item">
                <div className="member-avatar" style={{ background: avatarColor(i) }}>
                  {m.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="member-name">{m.user.name}</div>
                  <div className="member-email">{m.user.email}</div>
                </div>
                <span className={`badge ${m.role === 'Admin' ? 'badge-admin' : 'badge-member'}`}>{m.role}</span>
                {isAdmin && m.user._id !== user._id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {(taskModal === 'create' || (taskModal && typeof taskModal === 'object')) && (
        <TaskModal
          task={taskModal === 'create' ? null : taskModal}
          projectId={id}
          members={project.members}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
        />
      )}

      {addMember && (
        <AddMemberModal onClose={() => setAddMember(false)} onAdd={handleAddMember} />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
