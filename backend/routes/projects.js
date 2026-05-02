const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: check if user is admin of project
const isProjectAdmin = (project, userId) => {
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  return member && member.role === 'Admin';
};

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/projects
// @desc    Create a project
// @access  Private
router.post(
  '/',
  protect,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
    body('description').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description, color } = req.body;

    try {
      const project = await Project.create({
        name,
        description,
        color: color || '#6366f1',
        createdBy: req.user._id,
        members: [{ user: req.user._id, role: 'Admin' }]
      });

      await project.populate('members.user', 'name email');
      await project.populate('createdBy', 'name email');

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member
    const isMember = project.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project (Admin only)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can update the project' });
    }

    const { name, description, color } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;

    await project.save();
    await project.populate('members.user', 'name email');
    await project.populate('createdBy', 'name email');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project (Admin only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can delete the project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project (Admin only)
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({ user: userToAdd._id, role: role || 'Member' });
    await project.save();
    await project.populate('members.user', 'name email');
    await project.populate('createdBy', 'name email');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project (Admin only)
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    // Prevent removing self if only admin
    if (req.params.userId === req.user._id.toString()) {
      const adminCount = project.members.filter((m) => m.role === 'Admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the only admin' });
      }
    }

    project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
    await project.save();
    await project.populate('members.user', 'name email');
    await project.populate('createdBy', 'name email');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
