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
    enum: ['work', 'personal', 'health', 'learning', 'urgent', 'general'],
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
  }]
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