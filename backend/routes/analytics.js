const express = require('express');
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Get comprehensive analytics data
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query; // Default to 30 days, or 'all' for all time

    const isAllTime = days === 'all';
    const dayCount = isAllTime ? 365 : parseInt(days); // Default to 1 year for 'all time' charts

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - dayCount);

    // Get all todos for the user
    const todos = await Todo.find({ user: userId });

    // Basic stats
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;

    // Category breakdown
    const byCategory = {};
    const categoryCompletion = {};
    todos.forEach(todo => {
      byCategory[todo.category] = (byCategory[todo.category] || 0) + 1;
      if (!categoryCompletion[todo.category]) {
        categoryCompletion[todo.category] = { total: 0, completed: 0 };
      }
      categoryCompletion[todo.category].total++;
      if (todo.completed) {
        categoryCompletion[todo.category].completed++;
      }
    });

    // Priority breakdown
    const byPriority = {};
    todos.forEach(todo => {
      byPriority[todo.priority] = (byPriority[todo.priority] || 0) + 1;
    });

    // Daily completion trend (last N days)
    const dailyTrends = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const completedOnDay = todos.filter(t => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= date && completedDate < nextDate;
      }).length;

      const createdOnDay = todos.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= date && createdDate < nextDate;
      }).length;

      dailyTrends.push({
        date: date.toISOString().split('T')[0],
        completed: completedOnDay,
        created: createdOnDay
      });
    }

    // Productivity heatmap (last 90 days for better visualization)
    const heatmapData = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const activity = todos.filter(t => {
        if (!t.completedAt) return false;
        const completedDate = new Date(t.completedAt);
        return completedDate >= date && completedDate < nextDate;
      }).length;

      heatmapData.push({
        date: date.toISOString().split('T')[0],
        count: activity,
        level: activity === 0 ? 0 : activity <= 2 ? 1 : activity <= 4 ? 2 : activity <= 6 ? 3 : 4
      });
    }

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort heatmap data by date descending
    const sortedHeatmap = [...heatmapData].sort((a, b) => new Date(b.date) - new Date(a.date));

    for (let i = 0; i < sortedHeatmap.length; i++) {
      if (sortedHeatmap[i].count > 0) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
    }

    // Average completion time (for tasks with due dates)
    const tasksWithDueDates = todos.filter(t => t.completed && t.dueDate && t.completedAt);
    let avgCompletionTime = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    if (tasksWithDueDates.length > 0) {
      tasksWithDueDates.forEach(t => {
        const dueDate = new Date(t.dueDate);
        const completedDate = new Date(t.completedAt);

        if (completedDate <= dueDate) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      });
    }

    // Peak productivity hours (hour of day when most tasks are completed)
    const hourlyActivity = Array(24).fill(0);
    todos.filter(t => t.completedAt).forEach(t => {
      const hour = new Date(t.completedAt).getHours();
      hourlyActivity[hour]++;
    });

    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));

    // Achievements
    const achievements = [];

    if (completed >= 1) achievements.push({ id: 'first_task', name: 'First Step', description: 'Complete your first task', unlocked: true });
    if (completed >= 10) achievements.push({ id: 'ten_tasks', name: 'Getting Started', description: 'Complete 10 tasks', unlocked: true });
    if (completed >= 50) achievements.push({ id: 'fifty_tasks', name: 'Productive', description: 'Complete 50 tasks', unlocked: true });
    if (completed >= 100) achievements.push({ id: 'hundred_tasks', name: 'Century', description: 'Complete 100 tasks', unlocked: true });
    if (currentStreak >= 7) achievements.push({ id: 'week_streak', name: 'Week Warrior', description: '7-day streak', unlocked: true });
    if (longestStreak >= 30) achievements.push({ id: 'month_streak', name: 'Monthly Master', description: '30-day streak', unlocked: true });
    if (onTimeCount >= 10) achievements.push({ id: 'punctual', name: 'Punctual Pro', description: 'Complete 10 tasks on time', unlocked: true });

    res.json({
      summary: {
        total,
        completed,
        pending,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      },
      trends: {
        daily: dailyTrends,
        heatmap: heatmapData
      },
      breakdown: {
        byCategory,
        categoryCompletion,
        byPriority
      },
      productivity: {
        currentStreak,
        longestStreak,
        peakHour,
        onTimeCount,
        lateCount,
        onTimeRate: tasksWithDueDates.length > 0 ? Math.round((onTimeCount / tasksWithDueDates.length) * 100) : 0
      },
      achievements
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
