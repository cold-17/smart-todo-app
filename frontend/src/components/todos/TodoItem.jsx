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
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'text-blue-600 bg-blue-50';
      case 'personal': return 'text-purple-600 bg-purple-50';
      case 'health': return 'text-green-600 bg-green-50';
      case 'learning': return 'text-indigo-600 bg-indigo-50';
      case 'urgent': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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

  return (
    <div className={`bg-white rounded-lg p-4 hover:shadow-md transition-all ${
      todo.completed ? 'opacity-60' : ''
    } ${
      isOverdue() ? 'border-2 border-red-400 bg-red-50/30' : 'border'
    } ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
    }`}>
      <div className="flex items-start gap-3">
        {bulkMode ? (
          <button
            onClick={onToggleSelect}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 hover:border-blue-600'
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={handleToggleComplete}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
              todo.completed
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 hover:border-blue-600'
            }`}
          >
            {todo.completed && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-medium ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {todo.title}
          </h3>

          {todo.description && (
            <p className="text-gray-600 mt-1">{todo.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(todo.category)}`}>
              {todo.category}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </span>
            {isOverdue() && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                OVERDUE
              </span>
            )}
            {todo.dueDate && (
              <span className={`text-xs ${isOverdue() ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                Due: {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
            {getSubtaskProgress() && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                📋 {getSubtaskProgress().completed}/{getSubtaskProgress().total}
              </button>
            )}
          </div>

          {/* Subtasks Section */}
          {showSubtasks && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
              {todo.subtasks && todo.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <button
                    onClick={() => handleToggleSubtask(index)}
                    className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                      subtask.completed
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                  >
                    {subtask.completed && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {subtask.text}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add subtask input */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add subtask..."
                  className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-2 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Add subtask button if no subtasks */}
          {!showSubtasks && (!todo.subtasks || todo.subtasks.length === 0) && (
            <button
              onClick={() => setShowSubtasks(true)}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add checklist
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEditModal(true)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit todo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete todo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
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