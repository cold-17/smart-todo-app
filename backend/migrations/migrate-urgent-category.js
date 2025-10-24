const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/smart-todo-app')
  .then(() => console.log('MongoDB connected for migration'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define a simple Todo schema for migration
const TodoSchema = new mongoose.Schema({
  category: String,
  priority: String,
  title: String
}, { strict: false });

const Todo = mongoose.model('Todo', TodoSchema);

async function migrateUrgentCategory() {
  try {
    console.log('Starting migration: Converting "urgent" category to "general" with "urgent" priority...');

    // Find all todos with category "urgent"
    const urgentTodos = await Todo.find({ category: 'urgent' });

    console.log(`Found ${urgentTodos.length} todos with "urgent" category`);

    if (urgentTodos.length === 0) {
      console.log('No todos to migrate. Migration complete!');
      process.exit(0);
    }

    // Update each todo
    let updated = 0;
    for (const todo of urgentTodos) {
      await Todo.updateOne(
        { _id: todo._id },
        {
          $set: {
            category: 'general',
            priority: 'urgent'  // Ensure priority is set to urgent
          }
        }
      );
      updated++;
      console.log(`Migrated: "${todo.title}" - category: urgent -> general, priority: ${todo.priority || 'medium'} -> urgent`);
    }

    console.log(`\nMigration complete! Updated ${updated} todos.`);
    console.log('All todos with "urgent" category now have category="general" and priority="urgent"');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateUrgentCategory();
