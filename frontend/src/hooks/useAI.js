import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Parse natural language input into structured todo data
   * @param {string} input - Natural language task description
   * @returns {Promise<Object>} - Structured todo data
   */
  const parseTask = useCallback(async (input) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ai/parse-task`,
        { input },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to parse task';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Suggest priority based on task content
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @param {string} dueDate - Due date
   * @returns {Promise<string>} - Suggested priority
   */
  const suggestPriority = useCallback(async (title, description = '', dueDate = null) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ai/suggest-priority`,
        { title, description, dueDate },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setLoading(false);
      return response.data.priority;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to suggest priority';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Decompose a complex task into subtasks
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @returns {Promise<Array<string>>} - Array of subtask descriptions
   */
  const decomposeTask = useCallback(async (title, description = '') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ai/decompose-task`,
        { title, description },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setLoading(false);
      return response.data.subtasks;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to decompose task';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Auto-categorize a task based on content
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @returns {Promise<string>} - Suggested category
   */
  const categorizeTask = useCallback(async (title, description = '') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ai/categorize-task`,
        { title, description },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setLoading(false);
      return response.data.category;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to categorize task';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    parseTask,
    suggestPriority,
    decomposeTask,
    categorizeTask,
    loading,
    error,
    clearError
  };
};
