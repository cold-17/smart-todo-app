import { useState } from 'react';
import { useTodos } from '../../context/TodoContext';
import { useAI } from '../../hooks/useAI';

const SmartAddTodoForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    dueDate: ''
  });
  const [naturalInput, setNaturalInput] = useState('');
  const [isSmartMode, setIsSmartMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState([]);
  const { addTodo } = useTodos();
  const { parseTask, decomposeTask, loading: aiLoading, error: aiError } = useAI();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);

    // Convert suggested subtasks to proper format
    const subtasksToAdd = suggestedSubtasks.map(text => ({
      text,
      completed: false
    }));

    const result = await addTodo({
      ...formData,
      dueDate: formData.dueDate || null,
      subtasks: subtasksToAdd.length > 0 ? subtasksToAdd : undefined
    });

    if (result.success) {
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        dueDate: ''
      });
      setNaturalInput('');
      setSuggestedSubtasks([]);
      onClose?.();
    }
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSmartParse = async () => {
    if (!naturalInput.trim()) return;

    try {
      const parsed = await parseTask(naturalInput);

      // Update form data with parsed values
      setFormData({
        title: parsed.title || '',
        description: parsed.description || '',
        category: parsed.category || 'general',
        priority: parsed.priority || 'medium',
        dueDate: parsed.dueDate ? new Date(parsed.dueDate).toISOString().split('T')[0] : ''
      });

      // Set suggested subtasks if any
      if (parsed.subtasks && parsed.subtasks.length > 0) {
        setSuggestedSubtasks(parsed.subtasks);
      }

      // Switch to manual mode to show parsed fields
      setIsSmartMode(false);
    } catch (error) {
      console.error('Failed to parse task:', error);
    }
  };

  const handleGenerateSubtasks = async () => {
    if (!formData.title.trim()) return;

    try {
      const subtasks = await decomposeTask(formData.title, formData.description);
      setSuggestedSubtasks(subtasks);
    } catch (error) {
      console.error('Failed to generate subtasks:', error);
    }
  };

  const removeSubtask = (index) => {
    setSuggestedSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Task</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Use AI to quickly create tasks from natural language
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => setIsSmartMode(true)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              isSmartMode
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Smart Mode
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsSmartMode(false)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              !isSmartMode
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Manual Mode
          </button>
        </div>

        {/* AI Error Message */}
        {aiError && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">{aiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Smart Mode Input */}
          {isSmartMode && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <label htmlFor="naturalInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe your task naturally
              </label>
              <textarea
                id="naturalInput"
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                placeholder='Try: "Finish the marketing report by Friday" or "Buy groceries - milk, eggs, bread"'
                rows="3"
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleSmartParse}
                disabled={aiLoading || !naturalInput.trim()}
                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
              >
                {aiLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Parsing with AI...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Parse with AI
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Manual Mode Fields */}
          {!isSmartMode && (
            <>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional details..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="learning">Learning</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* AI Subtask Generator */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subtasks {suggestedSubtasks.length > 0 && `(${suggestedSubtasks.length})`}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSubtasks}
                    disabled={aiLoading || !formData.title.trim()}
                    className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {aiLoading ? 'Generating...' : '✨ AI Generate'}
                  </button>
                </div>

                {suggestedSubtasks.length > 0 && (
                  <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {suggestedSubtasks.map((subtask, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="flex-1 text-gray-700 dark:text-gray-300">{subtask}</span>
                        <button
                          type="button"
                          onClick={() => removeSubtask(index)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="px-5 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md hover:shadow-lg"
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmartAddTodoForm;
