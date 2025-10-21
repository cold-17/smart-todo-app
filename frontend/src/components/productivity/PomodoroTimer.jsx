import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const PomodoroTimer = ({ task, onClose }) => {
  const { darkMode } = useTheme();
  const [mode, setMode] = useState('work'); // work, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  useEffect(() => {
    // Initialize audio for notifications
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSAMR');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: mode === 'work' ? 'Time for a break!' : 'Time to focus!',
        icon: '/favicon.ico'
      });
    }

    // Auto-switch to next mode
    if (mode === 'work') {
      setCompletedPomodoros(prev => prev + 1);
      const nextMode = (completedPomodoros + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(nextMode === 'longBreak' ? LONG_BREAK : SHORT_BREAK);
    } else {
      setMode('work');
      setTimeLeft(WORK_TIME);
    }
  };

  const toggleTimer = () => {
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? WORK_TIME : mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK);
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? WORK_TIME : newMode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work'
    ? ((WORK_TIME - timeLeft) / WORK_TIME) * 100
    : mode === 'shortBreak'
    ? ((SHORT_BREAK - timeLeft) / SHORT_BREAK) * 100
    : ((LONG_BREAK - timeLeft) / LONG_BREAK) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Focus Timer
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task Info */}
        {task && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Working on:</p>
            <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
          <button
            onClick={() => switchMode('work')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === 'work'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === 'shortBreak'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === 'longBreak'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Long Break
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          {/* Progress Circle */}
          <svg className="w-full h-auto" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={darkMode ? '#374151' : '#e5e7eb'}
              strokeWidth="8"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={mode === 'work' ? '#3b82f6' : '#10b981'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={565.48}
              strokeDashoffset={565.48 - (565.48 * progress) / 100}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          {/* Timer Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={toggleTimer}
            className={`flex-1 h-14 rounded-2xl font-semibold text-white shadow-lg transition-all ${
              isRunning
                ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="h-14 px-6 rounded-2xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Reset
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedPomodoros}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Completed
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-800"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.floor((completedPomodoros * 25) / 60)}h {(completedPomodoros * 25) % 60}m
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total Focus
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
