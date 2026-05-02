const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard
// @desc    Get dashboard stats for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Get all projects the user is a member of
    const projects = await Project.find({ 'members.user': req.user._id }).select('_id name');
    const projectIds = projects.map((p) => p._id);

    // Get all tasks for those projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    const now = new Date();

    // Total tasks
    const totalTasks = allTasks.length;

    // Tasks by status
    const tasksByStatus = {
      'To Do': allTasks.filter((t) => t.status === 'To Do').length,
      'In Progress': allTasks.filter((t) => t.status === 'In Progress').length,
      'Done': allTasks.filter((t) => t.status === 'Done').length
    };

    // Overdue tasks (not done and past due date)
    const overdueTasks = allTasks.filter(
      (t) => t.status !== 'Done' && new Date(t.dueDate) < now
    ).length;

    // Tasks per user (for tasks the user can see)
    const tasksPerUserMap = {};
    allTasks.forEach((task) => {
      if (task.assignedTo) {
        const userId = task.assignedTo._id.toString();
        const userName = task.assignedTo.name;
        if (!tasksPerUserMap[userId]) {
          tasksPerUserMap[userId] = { name: userName, count: 0 };
        }
        tasksPerUserMap[userId].count++;
      }
    });
    const tasksPerUser = Object.values(tasksPerUserMap);

    // My tasks
    const myTasks = allTasks.filter(
      (t) => t.assignedTo && t.assignedTo._id.toString() === req.user._id.toString()
    );

    // Recent tasks (last 5)
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name color')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalTasks,
      tasksByStatus,
      overdueTasks,
      tasksPerUser,
      myTasksCount: myTasks.length,
      totalProjects: projects.length,
      recentTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
