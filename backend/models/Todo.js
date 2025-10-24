const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedList',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'learning', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  subtasks: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  recurrence: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      default: 'daily'
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    endDate: {
      type: Date
    },
    lastCreated: {
      type: Date
    },
    nextDue: {
      type: Date
    }
  },
  isRecurringInstance: {
    type: Boolean,
    default: false
  },
  recurringParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Todo',
    default: null
  }
}, {
  timestamps: true
});

// Update completedAt when todo is marked complete
TodoSchema.pre('save', function(next) {
  if (this.isModified('completed')) {
    if (this.completed) {
      this.completedAt = new Date();
    } else {
      this.completedAt = null;
    }
  }
  next();
});

module.exports = mongoose.model('Todo', TodoSchema);