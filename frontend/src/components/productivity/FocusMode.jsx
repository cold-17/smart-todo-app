import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTodos } from '../../context/TodoContext';
import { useTheme } from '../../context/ThemeContext';
import PomodoroTimer from './PomodoroTimer';

const FocusMode = ({ onClose }) => {
  const { todos, toggleTodoComplete, updateTodo } = useTodos();
  const { darkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Get only incomplete todos sorted by priority
  const incompleteTodos = todos
    .filter(t => !t.completed)
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const currentTodo = incompleteTodos[currentIndex];

  // Keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    // Don't trigger if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key.toLowerCase()) {
      case 'j':
      case 'arrowdown':
        e.preventDefault();
        setCurrentIndex(prev => Math.min(prev + 1, incompleteTodos.length - 1));
        break;
      case 'k':
      case 'arrowup':
        e.preventDefault();
        setCurrentIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'x':
      case ' ':
        e.preventDefault();
        if (currentTodo) {
          toggleTodoComplete(currentTodo._id, true);
          // Move to next task after completing
          if (currentIndex < incompleteTodos.length - 1) {
            setCurrentIndex(prev => prev);
          } else {
            setCurrentIndex(prev => Math.max(prev - 1, 0));
          }
        }
        break;
      case 't':
        e.preventDefault();
        setShowPomodoro(true);
        break;
      case 'escape':
        e.preventDefault();
        if (showHelp) {
          setShowHelp(false);
        } else {
          onClose();
        }
        break;
      case '?':
        e.preventDefault();
        setShowHelp(!showHelp);
        break;
      default:
        break;
    }
  }, [currentIndex, currentTodo, incompleteTodos.length, toggleTodoComplete, onClose, showHelp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (!currentTodo) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center"
          >
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">All Done!</h2>
          <p className="text-gray-400 mb-8">You've completed all your tasks. Time to relax!</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Exit Focus Mode
          </button>
        </motion.div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / incompleteTodos.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </motion.div>
          <div>
            <h1 className="text-white font-bold text-lg">Focus Mode</h1>
            <p className="text-gray-400 text-sm">{currentIndex + 1} of {incompleteTodos.length} tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Exit (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-20 left-0 right-0 h-1 bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTodo._id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center"
          >
            {/* Priority Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-block mb-6"
            >
              <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentTodo.priority === 'urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                currentTodo.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                currentTodo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {currentTodo.priority === 'urgent' && '🔥 '}{currentTodo.priority}
              </span>
            </motion.div>

            {/* Title */}
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              {currentTodo.title}
            </h2>

            {/* Description */}
            {currentTodo.description && (
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                {currentTodo.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-center gap-6 mb-12 text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="capitalize">{currentTodo.category}</span>
              </div>
              {currentTodo.dueDate && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(currentTodo.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {currentTodo.subtasks && currentTodo.subtasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{currentTodo.subtasks.filter(s => s.completed).length}/{currentTodo.subtasks.length} subtasks</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPomodoro(true)}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-bold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/30 flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Timer (T)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  toggleTodoComplete(currentTodo._id, true);
                  if (currentIndex < incompleteTodos.length - 1) {
                    setCurrentIndex(prev => prev);
                  } else {
                    setCurrentIndex(prev => Math.max(prev - 1, 0));
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Complete (X)
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Hints */}
        <div className="flex items-center justify-center gap-8 mt-8">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Previous (K/↑)</span>
          </button>

          <button
            onClick={() => setCurrentIndex(prev => Math.min(prev + 1, incompleteTodos.length - 1))}
            disabled={currentIndex === incompleteTodos.length - 1}
            className="flex items-center gap-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-sm">Next (J/↓)</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md mx-4"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                {[
                  { key: 'J or ↓', action: 'Next task' },
                  { key: 'K or ↑', action: 'Previous task' },
                  { key: 'X or Space', action: 'Complete task' },
                  { key: 'T', action: 'Start Pomodoro timer' },
                  { key: '?', action: 'Show/hide shortcuts' },
                  { key: 'Esc', action: 'Exit focus mode' },
                ].map(({ key, action }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{action}</span>
                    <kbd className="px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pomodoro Timer */}
      {showPomodoro && (
        <PomodoroTimer task={currentTodo} onClose={() => setShowPomodoro(false)} />
      )}

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default FocusMode;
