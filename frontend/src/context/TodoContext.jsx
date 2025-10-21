import { createContext, useContext, useReducer, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TodoContext = createContext();

const todoReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TODOS':
      return { ...state, todos: action.payload, loading: false };
    case 'ADD_TODO':
      return { ...state, todos: [action.payload, ...state.todos] };
    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo._id === action.payload._id ? action.payload : todo
        )
      };
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo._id !== action.payload)
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const TodoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    stats: null,
    loading: false,
    error: null
  });

  const { isAuthenticated } = useAuth();

  const fetchTodos = useCallback(async (filters = {}) => {
    if (!isAuthenticated) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.completed !== undefined) params.append('completed', filters.completed);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);

      const response = await axios.get(`/todos?${params}`);
      dispatch({ type: 'SET_TODOS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch todos' });
    }
  }, [isAuthenticated]);

  const addTodo = useCallback(async (todoData) => {
    try {
      const response = await axios.post('/todos', todoData);
      dispatch({ type: 'ADD_TODO', payload: response.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create todo';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateTodo = useCallback(async (id, updates) => {
    try {
      const response = await axios.put(`/todos/${id}`, updates);
      dispatch({ type: 'UPDATE_TODO', payload: response.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update todo';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteTodo = useCallback(async (id) => {
    try {
      await axios.delete(`/todos/${id}`);
      dispatch({ type: 'DELETE_TODO', payload: id });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete todo';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const toggleTodoComplete = useCallback(async (id, completed) => {
    return await updateTodo(id, { completed });
  }, [updateTodo]);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axios.get('/todos/stats');
      dispatch({ type: 'SET_STATS', payload: response.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [isAuthenticated]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <TodoContext.Provider value={{
      ...state,
      fetchTodos,
      addTodo,
      updateTodo,
      deleteTodo,
      toggleTodoComplete,
      fetchStats,
      clearError
    }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within TodoProvider');
  }
  return context;
};