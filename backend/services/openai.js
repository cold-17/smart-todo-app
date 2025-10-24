const OpenAI = require('openai');

// Only initialize OpenAI if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Parse natural language input into structured todo data
 * @param {string} input - Natural language task description
 * @returns {Promise<Object>} - Structured todo data
 */
async function parseTask(input) {
  try {
    if (!openai) {
      throw new Error('OpenAI service not configured');
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a task parser. Extract structured data from natural language task descriptions.

Return JSON with:
- title: concise task title (max 100 chars)
- description: detailed description (optional)
- category: one of [work, personal, health, learning, urgent, general]
- priority: one of [urgent, high, medium, low]
- dueDate: ISO date string if mentioned, null otherwise
- subtasks: array of subtask strings if the task can be broken down

Examples:
"Finish the marketing report by Friday" → {"title": "Finish marketing report", "category": "work", "priority": "high", "dueDate": "2025-10-24T00:00:00.000Z"}
"Buy groceries - milk, eggs, bread" → {"title": "Buy groceries", "category": "personal", "priority": "medium", "subtasks": ["Get milk", "Get eggs", "Get bread"]}
"URGENT: Fix production bug" → {"title": "Fix production bug", "category": "urgent", "priority": "urgent"}`
        },
        {
          role: "user",
          content: input
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    // Ensure valid category and priority
    const validCategories = ['work', 'personal', 'health', 'learning', 'urgent', 'general'];
    const validPriorities = ['urgent', 'high', 'medium', 'low'];

    if (!validCategories.includes(parsed.category)) {
      parsed.category = 'general';
    }
    if (!validPriorities.includes(parsed.priority)) {
      parsed.priority = 'medium';
    }

    return parsed;
  } catch (error) {
    console.error('OpenAI parseTask error:', error);
    throw new Error('Failed to parse task with AI');
  }
}

/**
 * Suggest priority based on task content and due date
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {Date} dueDate - Due date
 * @returns {Promise<string>} - Suggested priority (urgent, high, medium, low)
 */
async function suggestPriority(title, description = '', dueDate = null) {
  try {
    if (!openai) {
      return 'medium';
    }
    const dueDateInfo = dueDate ? `Due date: ${new Date(dueDate).toLocaleDateString()}` : 'No due date';

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a task priority analyzer. Suggest priority level based on task content and urgency.

Return JSON with a single field:
- priority: one of [urgent, high, medium, low]

Consider:
- Keywords like "urgent", "ASAP", "critical" → urgent
- Time-sensitive or deadline-driven → high
- Important but not time-critical → medium
- Routine or low-impact → low`
        },
        {
          role: "user",
          content: `Task: ${title}\nDescription: ${description}\n${dueDateInfo}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.priority || 'medium';
  } catch (error) {
    console.error('OpenAI suggestPriority error:', error);
    return 'medium'; // Fallback to medium priority
  }
}

/**
 * Decompose a complex task into subtasks
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @returns {Promise<Array<string>>} - Array of subtask descriptions
 */
async function decomposeTask(title, description = '') {
  try {
    if (!openai) {
      return [];
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a task decomposition expert. Break down complex tasks into actionable subtasks.

Return JSON with:
- subtasks: array of 3-7 clear, actionable subtask strings

Each subtask should:
- Be specific and actionable
- Start with a verb
- Be completable independently
- Be ordered logically

If the task is already simple, return an empty array.`
        },
        {
          role: "user",
          content: `Task: ${title}\nDescription: ${description}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.subtasks || [];
  } catch (error) {
    console.error('OpenAI decomposeTask error:', error);
    return []; // Return empty array on error
  }
}

/**
 * Auto-categorize a task based on content
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @returns {Promise<string>} - Suggested category
 */
async function categorizeTask(title, description = '') {
  try {
    if (!openai) {
      return 'general';
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a task categorization expert. Categorize tasks into the most appropriate category.

Return JSON with:
- category: one of [work, personal, health, learning, urgent, general]

Examples:
- "Team meeting" → work
- "Buy groceries" → personal
- "Go to gym" → health
- "Read React documentation" → learning
- "URGENT: Server down" → urgent
- "Miscellaneous task" → general`
        },
        {
          role: "user",
          content: `Task: ${title}\nDescription: ${description}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.category || 'general';
  } catch (error) {
    console.error('OpenAI categorizeTask error:', error);
    return 'general'; // Fallback to general category
  }
}

module.exports = {
  parseTask,
  suggestPriority,
  decomposeTask,
  categorizeTask
};
