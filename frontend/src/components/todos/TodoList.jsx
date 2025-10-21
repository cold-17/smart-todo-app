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
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Search & Filters</h3>

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
              <option value="urgent">Urgent</option>
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

      {/* Bulk Actions Bar */}
      <div className="bg-white rounded-lg border p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) deselectAll();
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              bulkMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
          </button>

          {bulkMode && (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
              >
                Deselect All
              </button>
              <span className="text-sm text-gray-600">
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
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Complete Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete Selected
              </button>
            </>
          )}
          <button
            onClick={handleDeleteCompleted}
            className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
          >
            Clear Completed
          </button>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredAndSortedTodos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchQuery.trim() ? 'No matching todos found' : 'No todos found'}
            </h3>
            <p className="text-gray-500">
              {searchQuery.trim()
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first todo!'
              }
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