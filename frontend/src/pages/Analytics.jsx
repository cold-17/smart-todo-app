import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';

const Analytics = () => {
  const { axios } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/analytics?days=${timeRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Failed to load analytics</p>
      </div>
    );
  }

  const CATEGORY_COLORS = {
    work: '#3b82f6',
    personal: '#8b5cf6',
    health: '#10b981',
    learning: '#f59e0b',
    urgent: '#ef4444',
    general: '#6b7280'
  };

  const PRIORITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444'
  };

  // Prepare category data for pie chart
  const categoryData = Object.entries(analytics.breakdown.byCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: CATEGORY_COLORS[name]
  }));

  // Prepare priority data for bar chart
  const priorityData = Object.entries(analytics.breakdown.byPriority).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: PRIORITY_COLORS[name]
  }));

  // Format daily trends data
  const trendsData = analytics.trends.daily.map(day => ({
    ...day,
    date: format(parseISO(day.date), 'MMM dd')
  }));

  // Get heatmap data for last 12 weeks
  const heatmapData = analytics.trends.heatmap.slice(-84); // Last 12 weeks

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-stone-200/30 dark:border-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                Analytics
              </h1>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
              {[7, 30, 90, 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                    timeRange === range
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {range === 'all' ? 'All Time' : `${range}d`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div className="h-14"></div>

      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <SummaryCard
            title="Completion Rate"
            value={`${analytics.summary.completionRate}%`}
            icon="📊"
            color="blue"
          />
          <SummaryCard
            title="Current Streak"
            value={`${analytics.productivity.currentStreak} days`}
            icon="🔥"
            color="orange"
          />
          <SummaryCard
            title="Longest Streak"
            value={`${analytics.productivity.longestStreak} days`}
            icon="🏆"
            color="purple"
          />
          <SummaryCard
            title="Peak Hour"
            value={`${analytics.productivity.peakHour}:00`}
            icon="⏰"
            color="green"
          />
          <SummaryCard
            title="On-Time Rate"
            value={`${analytics.productivity.onTimeRate}%`}
            icon="✅"
            color="pink"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Trends Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Daily Activity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis
                  dataKey="date"
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    color: darkMode ? '#ffffff' : '#000000'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Completed"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Created"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tasks by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis
                  dataKey="name"
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Productivity Heatmap */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activity Heatmap (Last 12 Weeks)
            </h3>
            <div className="flex flex-wrap gap-1">
              {heatmapData.map((day, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.level, darkMode)}`}
                  title={`${day.date}: ${day.count} tasks`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Less</span>
              <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(0, darkMode)}`} />
              <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(1, darkMode)}`} />
              <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(2, darkMode)}`} />
              <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(3, darkMode)}`} />
              <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(4, darkMode)}`} />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {analytics.achievements.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {analytics.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800"
                >
                  <div className="text-3xl mb-2">🏆</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {achievement.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 p-5 hover:border-stone-300 dark:hover:border-slate-700 transition-all">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[color]} flex items-center justify-center text-xl mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

const getHeatmapColor = (level, darkMode) => {
  if (darkMode) {
    switch (level) {
      case 0: return 'bg-gray-800';
      case 1: return 'bg-green-900';
      case 2: return 'bg-green-700';
      case 3: return 'bg-green-500';
      case 4: return 'bg-green-400';
      default: return 'bg-gray-800';
    }
  } else {
    switch (level) {
      case 0: return 'bg-gray-200';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-300';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  }
};

export default Analytics;
