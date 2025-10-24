const Todo = require('../models/Todo');

/**
 * Calculate the next due date based on recurrence pattern
 */
function calculateNextDueDate(todo, fromDate = new Date()) {
  const { recurrence } = todo;
  if (!recurrence || !recurrence.enabled) return null;

  const baseDate = new Date(fromDate);
  let nextDate = new Date(baseDate);

  switch (recurrence.pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + recurrence.interval);
      break;

    case 'weekly':
      // If daysOfWeek is specified, find the next occurrence
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
        const currentDay = nextDate.getDay();

        // Find next day in the week
        let foundDay = sortedDays.find(day => day > currentDay);

        if (foundDay !== undefined) {
          // Next occurrence is in this week
          nextDate.setDate(nextDate.getDate() + (foundDay - currentDay));
        } else {
          // Next occurrence is next week
          const firstDay = sortedDays[0];
          const daysUntilNextWeek = 7 - currentDay + firstDay;
          nextDate.setDate(nextDate.getDate() + daysUntilNextWeek);
        }
      } else {
        // Default: every N weeks from base date
        nextDate.setDate(nextDate.getDate() + (7 * recurrence.interval));
      }
      break;

    case 'monthly':
      if (recurrence.dayOfMonth) {
        // Specific day of month
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
        nextDate.setDate(Math.min(recurrence.dayOfMonth, getDaysInMonth(nextDate)));
      } else {
        // Same day next month
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
      }
      break;

    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
      break;

    default:
      return null;
  }

  // Check if nextDate exceeds endDate
  if (recurrence.endDate && nextDate > new Date(recurrence.endDate)) {
    return null;
  }

  return nextDate;
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Create the next instance of a recurring todo
 */
async function createNextInstance(parentTodo) {
  try {
    const nextDue = calculateNextDueDate(parentTodo, new Date());

    if (!nextDue) {
      // Recurrence has ended or no valid next date
      return null;
    }

    // Create new todo instance
    const newTodo = new Todo({
      user: parentTodo.user,
      sharedList: parentTodo.sharedList,
      title: parentTodo.title,
      description: parentTodo.description,
      category: parentTodo.category,
      priority: parentTodo.priority,
      dueDate: nextDue,
      subtasks: parentTodo.subtasks.map(st => ({
        text: st.text,
        completed: false
      })),
      isRecurringInstance: true,
      recurringParent: parentTodo._id,
      completed: false
    });

    await newTodo.save();

    // Update parent's lastCreated and nextDue
    parentTodo.recurrence.lastCreated = new Date();
    parentTodo.recurrence.nextDue = nextDue;
    await parentTodo.save();

    return newTodo;
  } catch (error) {
    console.error('Error creating next instance:', error);
    throw error;
  }
}

/**
 * Check and create overdue recurring instances
 * This should be run periodically (e.g., daily cron job)
 */
async function processOverdueRecurrences() {
  try {
    const now = new Date();

    // Find all todos with active recurrence where nextDue is past or not set
    const recurringTodos = await Todo.find({
      'recurrence.enabled': true,
      $or: [
        { 'recurrence.nextDue': { $lte: now } },
        { 'recurrence.nextDue': null }
      ]
    });

    console.log(`Processing ${recurringTodos.length} overdue recurrences...`);

    const results = [];
    for (const todo of recurringTodos) {
      // Check if instance already exists for this period
      const existingInstance = await Todo.findOne({
        recurringParent: todo._id,
        dueDate: { $gte: todo.recurrence.lastCreated || new Date(0) }
      });

      if (!existingInstance) {
        const newInstance = await createNextInstance(todo);
        if (newInstance) {
          results.push(newInstance);
        }
      }
    }

    console.log(`Created ${results.length} new recurring instances`);
    return results;
  } catch (error) {
    console.error('Error processing overdue recurrences:', error);
    throw error;
  }
}

/**
 * Handle todo completion - create next instance if recurring
 */
async function handleRecurringCompletion(todoId) {
  try {
    const todo = await Todo.findById(todoId);

    if (!todo) return null;

    // If this is a recurring parent or has recurrence enabled
    if (todo.recurrence && todo.recurrence.enabled && !todo.isRecurringInstance) {
      return await createNextInstance(todo);
    }

    return null;
  } catch (error) {
    console.error('Error handling recurring completion:', error);
    throw error;
  }
}

module.exports = {
  calculateNextDueDate,
  createNextInstance,
  processOverdueRecurrences,
  handleRecurringCompletion
};
