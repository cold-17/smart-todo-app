import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTodos } from '../context/TodoContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import EnhancedTodoList from '../components/todos/EnhancedTodoList';
import SmartAddTodoForm from '../components/todos/SmartAddTodoForm';
import ShareModal from '../components/collaboration/ShareModal';
import FocusMode from '../components/productivity/FocusMode';
import ExportModal from '../components/common/ExportModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { stats, fetchStats } = useTodos();
  const { darkMode, toggleDarkMode } = useTheme();
  const { connected, activeUsers } = useSocket();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Navigation - Apple Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-b border-gray-200/20 dark:border-gray-800/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                Tasks
              </h1>
            </div>

            {/* Center - User greeting */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Hello, <span className="text-gray-900 dark:text-white">{user?.username}</span>
              </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-2 px-2 py-1">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} title={connected ? 'Connected' : 'Disconnected'}></div>
                {activeUsers.length > 1 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {activeUsers.length - 1} online
                  </span>
                )}
              </div>

              <button
                onClick={() => window.location.href = '/analytics'}
                className="px-3 h-8 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center gap-1.5"
                title="View Analytics"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Analytics</span>
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 h-8 rounded-full text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 flex items-center gap-1.5"
                title="Export Tasks"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={toggleDarkMode}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="px-3 h-8 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-14"></div>

      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Stats Cards - Clean Apple Style */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Total Tasks Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>

            {/* Completed Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Done</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>

            {/* Pending Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>

            {/* Success Rate Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Success</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</p>
                {stats.completionRate >= 70 && <span className="text-lg">🎉</span>}
              </div>
            </div>
          </div>
        )}

        {/* Header Section - Apple Style */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                My Tasks
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {stats ? `${stats.pending} active • ${stats.completed} completed` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFocusMode(true)}
                className="group h-10 px-5 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Focus</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="group h-10 px-5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Collaborate</span>
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="group h-10 px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-2"
              >
                <svg className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <EnhancedTodoList />
        </div>

        {/* Add Todo Form Modal */}
        {showAddForm && (
          <SmartAddTodoForm onClose={() => setShowAddForm(false)} />
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal onClose={() => setShowShareModal(false)} />
        )}

        {/* Focus Mode */}
        {showFocusMode && (
          <FocusMode onClose={() => setShowFocusMode(false)} />
        )}

        {/* Export Modal */}
        {showExportModal && (
          <ExportModal onClose={() => setShowExportModal(false)} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;