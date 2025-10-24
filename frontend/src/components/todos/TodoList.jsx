import { useState, useEffect } from 'react';
import { useTodos } from '../../context/TodoContext';
import TodoItem from './TodoItem';

const TodoList = () => {
  const { todos, loading, error, fetchTodos, updateTodo, deleteTodo } = useTodos();
  const [filters, setFilters] = useState({
    category: 'all',
    completed: undefined,
    priority: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    fetchTodos(filters);
  }, [filters, fetchTodos]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleSelectTodo = (todoId) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(todoId)) {
      newSelected.delete(todoId);
    } else {
      newSelected.add(todoId);
    }
    setSelectedTodos(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredAndSortedTodos.map(t => t._id));
    setSelectedTodos(allIds);
  };

  const deselectAll = () => {
    setSelectedTodos(new Set());
  };

  const handleBulkComplete = async () => {
    for (const todoId of selectedTodos) {
      await updateTodo(todoId, { completed: true });
    }
    deselectAll();
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTodos.size} todos?`)) {
      for (const todoId of selectedTodos) {
        await deleteTodo(todoId);
      }
      deselectAll();
    }
  };

  const handleDeleteCompleted = async () => {
    const completedTodos = todos.filter(t => t.completed);
    if (completedTodos.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${completedTodos.length} completed todos?`)) {
      for (const todo of completedTodos) {
        await deleteTodo(todo._id);
      }
    }
  };

  // Filter and sort todos
  const filteredAndSortedTodos = todos
    .filter(todo => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const titleMatch = todo.title.toLowerCase().includes(query);
      const descriptionMatch = todo.description?.toLowerCase().includes(query) || false;

      return titleMatch || descriptionMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'dueDate': {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        case 'category':
          return a.category.localeCompare(b.category);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Search and Filters - Clean Apple Style */}
      <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Filters
        </h3>

        {/* Search Bar */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search todos by title or description..."
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={filters.completed === undefined ? 'all' : filters.completed.toString()}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('completed', value === 'all' ? undefined : value === 'true');
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="false">Active</option>
              <option value="true">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="createdAt">Created Date (Newest)</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Bulk Actions Bar - Minimal */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) deselectAll();
            }}
            className={`h-8 px-3 rounded-full text-xs font-semibold transition-all ${
              bulkMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {bulkMode ? 'Done' : 'Select'}
          </button>

          {bulkMode && (
            <>
              <button
                onClick={selectAll}
                className="h-8 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                All
              </button>
              <button
                onClick={deselectAll}
                className="h-8 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                None
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">
                {selectedTodos.size} selected
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {bulkMode && selectedTodos.size > 0 && (
            <>
              <button
                onClick={handleBulkComplete}
                className="h-8 px-3 bg-green-600 text-white rounded-full text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm"
              >
                Complete
              </button>
              <button
                onClick={handleBulkDelete}
                className="h-8 px-3 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </>
          )}
          <button
            onClick={handleDeleteCompleted}
            className="h-8 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Clear Done
          </button>
        </div>
      </div>

      {/* Todo List */}
      <div className="p-6 space-y-3">
        {filteredAndSortedTodos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery.trim() ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery.trim()
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'}
            </p>
          </div>
        ) : (
          filteredAndSortedTodos.map(todo => (
            <TodoItem
              key={todo._id}
              todo={todo}
              bulkMode={bulkMode}
              isSelected={selectedTodos.has(todo._id)}
              onToggleSelect={() => toggleSelectTodo(todo._id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;