const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Helper: get user's role in a project
const getUserRole = (project, userId) => {
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Helper: check project access
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const role = getUserRole(project, userId);
  if (!role) return { error: 'Access denied', status: 403 };
  return { project, role };
};

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { error, status } = await checkProjectAccess(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a task (Admin only)
// @access  Private
router.post(
  '/',
  protect,
  [
    body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
    body('project').notEmpty().withMessage('Project is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, dueDate, priority, project: projectId, assignedTo } = req.body;

    try {
      const { error, status, project, role } = await checkProjectAccess(projectId, req.user._id);
      if (error) return res.status(status).json({ message: error });

      if (role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can create tasks' });
      }

      // Validate assignedTo is a project member
      if (assignedTo) {
        const isMember = project.members.some((m) => m.user.toString() === assignedTo);
        if (!isMember) {
          return res.status(400).json({ message: 'Assigned user is not a project member' });
        }
      }

      const task = await Task.create({
        title,
        description,
        dueDate,
        priority: priority || 'Medium',
        project: projectId,
        assignedTo: assignedTo || null,
        createdBy: req.user._id
      });

      await task.populate('assignedTo', 'name email');
      await task.populate('createdBy', 'name email');

      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private (Admin: all fields; Member: only status if assigned)
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { error, status, role } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const { title, description, dueDate, priority, status: taskStatus, assignedTo } = req.body;

    if (role === 'Admin') {
      // Admin can update all fields
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate) task.dueDate = dueDate;
      if (priority) task.priority = priority;
      if (taskStatus) task.status = taskStatus;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    } else {
      // Member can only update status on their assigned tasks
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }
      if (taskStatus) task.status = taskStatus;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task (Admin only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { error, status, role } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(status).json({ message: error });

    if (role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
