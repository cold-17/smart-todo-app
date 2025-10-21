const mongoose = require('mongoose');

const sharedListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor'
    }
  }],
  // Store emails of users invited but not yet joined
  pendingInvites: [{
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
sharedListSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add owner to members array automatically
sharedListSchema.pre('save', function(next) {
  // Only run on new documents
  if (this.isNew) {
    const ownerExists = this.members.some(
      member => member.user.toString() === this.owner.toString()
    );

    if (!ownerExists) {
      this.members.push({
        user: this.owner,
        role: 'owner'
      });
    }
  }
  next();
});

// Check if a user is a member of this shared list
sharedListSchema.methods.isMember = function(userId) {
  return this.members.some(
    member => member.user.toString() === userId.toString()
  );
};

// Get user's role in this list
sharedListSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(
    m => m.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Check if user can edit
sharedListSchema.methods.canEdit = function(userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'editor';
};

module.exports = mongoose.model('SharedList', sharedListSchema);
