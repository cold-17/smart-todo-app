const express = require('express');
const SharedList = require('../models/SharedList');
const User = require('../models/User');
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, sharedListSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Get all shared lists for the current user
router.get('/', async (req, res) => {
  try {
    const lists = await SharedList.find({
      'members.user': req.user._id
    })
    .populate('owner', 'username email')
    .populate('members.user', 'username email')
    .sort({ updatedAt: -1 });

    res.json(lists);
  } catch (error) {
    logger.error('Get shared lists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific shared list
router.get('/:id', async (req, res) => {
  try {
    const list = await SharedList.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    if (!list) {
      return res.status(404).json({ message: 'Shared list not found' });
    }

    // Check if user is a member
    if (!list.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(list);
  } catch (error) {
    logger.error('Get shared list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new shared list
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'List name is required' });
    }

    const list = new SharedList({
      name: name.trim(),
      owner: req.user._id
    });

    await list.save();

    const populatedList = await SharedList.findById(list._id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    res.status(201).json(populatedList);
  } catch (error) {
    logger.error('Create shared list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite user to shared list by email
router.post('/:id/invite', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const list = await SharedList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'Shared list not found' });
    }

    // Only owner can invite
    if (list.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the list owner can invite members' });
    }

    // Check if user exists
    const invitedUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (invitedUser) {
      // Check if already a member
      if (list.isMember(invitedUser._id)) {
        return res.status(400).json({ message: 'User is already a member of this list' });
      }

      // Add user to members
      list.members.push({
        user: invitedUser._id,
        role: 'editor'
      });
    } else {
      // Add to pending invites
      const alreadyInvited = list.pendingInvites.some(
        invite => invite.email === email.trim().toLowerCase()
      );

      if (alreadyInvited) {
        return res.status(400).json({ message: 'User has already been invited' });
      }

      list.pendingInvites.push({
        email: email.trim().toLowerCase(),
        invitedBy: req.user._id
      });
    }

    await list.save();

    const populatedList = await SharedList.findById(list._id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email')
      .populate('pendingInvites.invitedBy', 'username email');

    res.json(populatedList);
  } catch (error) {
    logger.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove user from shared list
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const list = await SharedList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'Shared list not found' });
    }

    // Only owner can remove members (or users can remove themselves)
    const isOwner = list.owner.toString() === req.user._id.toString();
    const isSelfRemoval = req.params.userId === req.user._id.toString();

    if (!isOwner && !isSelfRemoval) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can't remove the owner
    if (req.params.userId === list.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the list owner' });
    }

    list.members = list.members.filter(
      member => member.user.toString() !== req.params.userId
    );

    await list.save();

    const populatedList = await SharedList.findById(list._id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    res.json(populatedList);
  } catch (error) {
    logger.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete shared list
router.delete('/:id', async (req, res) => {
  try {
    const list = await SharedList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'Shared list not found' });
    }

    // Only owner can delete
    if (list.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the list owner can delete this list' });
    }

    // Delete all todos associated with this list
    await Todo.deleteMany({ sharedList: req.params.id });

    await SharedList.findByIdAndDelete(req.params.id);

    res.json({ message: 'Shared list and associated todos deleted successfully' });
  } catch (error) {
    logger.error('Delete shared list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get todos for a shared list
router.get('/:id/todos', async (req, res) => {
  try {
    const list = await SharedList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'Shared list not found' });
    }

    // Check if user is a member
    if (!list.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { category, completed, priority } = req.query;

    let filter = { sharedList: req.params.id };

    // Apply filters
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    const todos = await Todo.find(filter)
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json(todos);
  } catch (error) {
    logger.error('Get shared list todos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
