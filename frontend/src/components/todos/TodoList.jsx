import { useState, useEffect } from 'react';
import { useTodos } from '../../context/TodoContext';
import TodoItem from './TodoItem';

const TodoList = () => {
  const { todos, loading, error, fetchTodos } = useTodos();
  const [filters, setFilters] = useState({
    category: 'all',
    completed: undefined,
    priority: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTodos(filters);
  }, [filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Filter todos based on search query
  const filteredTodos = todos.filter(todo => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = todo.title.toLowerCase().includes(query);
    const descriptionMatch = todo.description?.toLowerCase().includes(query) || false;

    return titleMatch || descriptionMatch;
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
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
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
          filteredTodos.map(todo => (
            <TodoItem key={todo._id} todo={todo} />
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;