import { useState } from 'react';
import { useTodos } from '../../context/TodoContext';
import EditTodoForm from './EditTodoForm';

const TodoItem = ({ todo, bulkMode = false, isSelected = false, onToggleSelect }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const { deleteTodo, toggleTodoComplete, updateTodo } = useTodos();

  const handleToggleComplete = async () => {
    await toggleTodoComplete(todo._id, !todo.completed);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      await deleteTodo(todo._id);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    const subtasks = [...(todo.subtasks || []), { text: newSubtask.trim(), completed: false }];
    await updateTodo(todo._id, { subtasks });
    setNewSubtask('');
  };

  const handleToggleSubtask = async (index) => {
    const subtasks = [...(todo.subtasks || [])];
    subtasks[index].completed = !subtasks[index].completed;
    await updateTodo(todo._id, { subtasks });
  };

  const handleDeleteSubtask = async (index) => {
    const subtasks = [...(todo.subtasks || [])];
    subtasks.splice(index, 1);
    await updateTodo(todo._id, { subtasks });
  };

  const getSubtaskProgress = () => {
    if (!todo.subtasks || todo.subtasks.length === 0) return null;
    const completed = todo.subtasks.filter(st => st.completed).length;
    return { completed, total: todo.subtasks.length };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'personal': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'health': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'learning': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const isOverdue = () => {
    if (!todo.dueDate || todo.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const progress = getSubtaskProgress();
  const progressPercentage = progress ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden ${
      todo.completed ? 'opacity-70' : ''
    } ${
      isOverdue() ? 'ring-2 ring-red-400 dark:ring-red-600' : 'border border-gray-200 dark:border-gray-700'
    } ${
      isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
    }`}>
      {/* Progress bar for subtasks */}
      {progress && progress.total > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={bulkMode ? onToggleSelect : handleToggleComplete}
            className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-1 transition-all duration-200 ${
              (bulkMode ? isSelected : todo.completed)
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent scale-110'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-110'
            }`}
          >
            {(bulkMode ? isSelected : todo.completed) && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={`text-lg font-semibold mb-1 transition-all ${
              todo.completed
                ? 'line-through text-gray-400 dark:text-gray-600'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {todo.title}
            </h3>

            {/* Description */}
            {todo.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {todo.description}
              </p>
            )}

            {/* Tags Row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {/* Category Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${getCategoryColor(todo.category)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {todo.category}
              </span>

              {/* Priority Badge */}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                {todo.priority === 'urgent' && '🔥'}
                {todo.priority === 'high' && '⚠️'}
                {todo.priority === 'medium' && '📋'}
                {todo.priority === 'low' && '📌'}
                <span className="ml-1">{todo.priority}</span>
              </span>

              {/* Overdue Badge */}
              {isOverdue() && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white animate-pulse shadow-lg">
                  ⏰ OVERDUE
                </span>
              )}

              {/* Due Date */}
              {todo.dueDate && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  isOverdue()
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              )}

              {/* Subtasks Progress */}
              {progress && (
                <button
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {progress.completed}/{progress.total}
                  <svg className={`w-3 h-3 transition-transform ${showSubtasks ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Subtasks Section */}
            {showSubtasks && (
              <div className="mt-4 space-y-2 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                {todo.subtasks && todo.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2.5 group/subtask">
                    <button
                      onClick={() => handleToggleSubtask(index)}
                      className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        subtask.completed
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400'
                      }`}
                    >
                      {subtask.completed && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-sm flex-1 transition-all ${
                      subtask.completed
                        ? 'line-through text-gray-400 dark:text-gray-600'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {subtask.text}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(index)}
                      className="opacity-0 group-hover/subtask:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add Subtask Input */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Add a subtask..."
                    className="flex-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Add Checklist Button */}
            {!showSubtasks && (!todo.subtasks || todo.subtasks.length === 0) && (
              <button
                onClick={() => setShowSubtasks(true)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors mt-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add checklist
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              title="Edit todo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Delete todo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTodoForm todo={todo} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
};

export default TodoItem;
