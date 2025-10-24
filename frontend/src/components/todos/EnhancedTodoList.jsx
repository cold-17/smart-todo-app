import { useState, useEffect } from 'react';
import { useTodos } from '../../context/TodoContext';
import TodoItem from './TodoItem';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTodoItem } from './SortableTodoItem';
import { motion, AnimatePresence } from 'framer-motion';

const EnhancedTodoList = ({ quickFilter = null, onClearQuickFilter = () => {} }) => {
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
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage or default to 'list'
    return localStorage.getItem('todoViewMode') || 'list';
  });
  const [localTodos, setLocalTodos] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTodos(filters);
  }, [filters, fetchTodos]);

  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('todoViewMode', viewMode);
  }, [viewMode]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      category: 'all',
      completed: undefined,
      priority: 'all'
    });
    setSearchQuery('');
    onClearQuickFilter();
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
    const completedTodos = localTodos.filter(t => t.completed);
    if (completedTodos.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${completedTodos.length} completed todos?`)) {
      for (const todo of completedTodos) {
        await deleteTodo(todo._id);
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalTodos((items) => {
        const oldIndex = items.findIndex(item => item._id === active.id);
        const newIndex = items.findIndex(item => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Filter and sort todos
  const filteredAndSortedTodos = localTodos
    .filter(todo => {
      // Apply quick filter from stat cards
      if (quickFilter === 'completed' && !todo.completed) return false;
      if (quickFilter === 'active' && todo.completed) return false;
      if (quickFilter === 'dueToday') {
        if (todo.completed) return false;
        if (!todo.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const dueDate = new Date(todo.dueDate);
        if (dueDate < today || dueDate > todayEnd) return false;
      }
      // 'all' or null shows everything

      // Apply search filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const titleMatch = todo.title.toLowerCase().includes(query);
      const descriptionMatch = todo.description?.toLowerCase().includes(query) || false;

      // Also search in subtasks
      const subtaskMatch = todo.subtasks?.some(subtask =>
        subtask.text.toLowerCase().includes(query)
      ) || false;

      return titleMatch || descriptionMatch || subtaskMatch;
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-8 w-8 border-b-2 border-blue-600"
        />
      </div>
    );
  }

  // Check if any filters are active
  const hasActiveFilters = filters.category !== 'all' || filters.completed !== undefined || filters.priority !== 'all' || searchQuery.trim() !== '' || quickFilter;
  const activeFilterCount = [
    filters.category !== 'all',
    filters.completed !== undefined,
    filters.priority !== 'all',
    searchQuery.trim() !== '',
    quickFilter
  ].filter(Boolean).length;

  return (
    <div className="space-y-0">
      {/* Search and Filters - Simplified UI */}
      <div className="bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Filters & View
            </h3>
            {/* Active Filters Indicator */}
            {hasActiveFilters && (
              <>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  {activeFilterCount} active
                </motion.span>
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-full text-xs font-medium transition-colors"
                  title="Clear all filters"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </motion.button>
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'} transition-all`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'} transition-all`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded ${viewMode === 'compact' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'} transition-all`}
              title="Compact view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar with animation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Search</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search todos by title or description..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Status</label>
            <select
              value={filters.completed === undefined ? 'all' : filters.completed.toString()}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('completed', value === 'all' ? undefined : value === 'true');
              }}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            >
              <option value="all">All</option>
              <option value="false">Active</option>
              <option value="true">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
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
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
            >
              <option value="createdAt">Newest First</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar - Enhanced */}
      <div className="bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) deselectAll();
            }}
            className={`h-9 px-4 rounded-full text-xs font-semibold transition-all shadow-sm ${
              bulkMode
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/30'
                : 'bg-stone-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-slate-700'
            }`}
          >
            {bulkMode ? '✓ Done' : 'Select Multiple'}
          </motion.button>

          <AnimatePresence>
            {bulkMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={selectAll}
                  className="h-9 px-3 bg-stone-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={deselectAll}
                  className="h-9 px-3 bg-stone-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                >
                  None
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  {selectedTodos.size} selected
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {bulkMode && selectedTodos.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkComplete}
                  className="h-9 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full text-xs font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-sm shadow-green-500/30"
                >
                  ✓ Complete All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkDelete}
                  className="h-9 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full text-xs font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-sm shadow-red-500/30"
                >
                  🗑️ Delete All
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDeleteCompleted}
            className="h-9 px-4 bg-stone-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
          >
            Clear Completed
          </motion.button>
        </div>
      </div>

      {/* Todo List with Drag & Drop */}
      <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
        {filteredAndSortedTodos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 col-span-full"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery.trim() ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery.trim()
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'}
            </p>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredAndSortedTodos.map(t => t._id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {filteredAndSortedTodos.map((todo, index) => (
                  <SortableTodoItem
                    key={todo._id}
                    todo={todo}
                    index={index}
                    bulkMode={bulkMode}
                    isSelected={selectedTodos.has(todo._id)}
                    onToggleSelect={() => toggleSelectTodo(todo._id)}
                    viewMode={viewMode}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default EnhancedTodoList;
