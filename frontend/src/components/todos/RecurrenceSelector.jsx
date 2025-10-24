import { useState, useEffect } from 'react';

const RecurrenceSelector = ({ value = {}, onChange }) => {
  const [enabled, setEnabled] = useState(value.enabled || false);
  const [pattern, setPattern] = useState(value.pattern || 'daily');
  const [interval, setInterval] = useState(value.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState(value.daysOfWeek || []);
  const [dayOfMonth, setDayOfMonth] = useState(value.dayOfMonth || 1);
  const [endDate, setEndDate] = useState(value.endDate || '');

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  useEffect(() => {
    if (onChange) {
      onChange({
        enabled,
        pattern,
        interval,
        daysOfWeek,
        dayOfMonth,
        endDate: endDate || null
      });
    }
  }, [enabled, pattern, interval, daysOfWeek, dayOfMonth, endDate]);

  const toggleDayOfWeek = (day) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="recurrence-enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="recurrence-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          🔄 Repeat this task
        </label>
      </div>

      {enabled && (
        <div className="pl-7 space-y-4 border-l-2 border-blue-200 dark:border-blue-800">
          {/* Pattern Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat Pattern
            </label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pattern === 'daily' && `day${interval > 1 ? 's' : ''}`}
                {pattern === 'weekly' && `week${interval > 1 ? 's' : ''}`}
                {pattern === 'monthly' && `month${interval > 1 ? 's' : ''}`}
                {pattern === 'yearly' && `year${interval > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* Days of Week (for weekly pattern) */}
          {pattern === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repeat on
              </label>
              <div className="flex gap-2 flex-wrap">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      daysOfWeek.includes(day.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly pattern) */}
          {pattern === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Day of month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* End Date (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {endDate && (
              <button
                type="button"
                onClick={() => setEndDate('')}
                className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear end date
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Summary:</strong> {getSummary()}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  function getSummary() {
    if (!enabled) return 'Not repeating';

    let summary = `Repeats every `;

    if (interval > 1) {
      summary += `${interval} `;
    }

    switch (pattern) {
      case 'daily':
        summary += interval > 1 ? 'days' : 'day';
        break;
      case 'weekly':
        summary += interval > 1 ? 'weeks' : 'week';
        if (daysOfWeek.length > 0) {
          const dayNames = daysOfWeek.map(d => weekDays.find(wd => wd.value === d)?.label).join(', ');
          summary += ` on ${dayNames}`;
        }
        break;
      case 'monthly':
        summary += interval > 1 ? 'months' : 'month';
        if (dayOfMonth) {
          summary += ` on day ${dayOfMonth}`;
        }
        break;
      case 'yearly':
        summary += interval > 1 ? 'years' : 'year';
        break;
    }

    if (endDate) {
      summary += ` until ${new Date(endDate).toLocaleDateString()}`;
    }

    return summary;
  }
};

export default RecurrenceSelector;
