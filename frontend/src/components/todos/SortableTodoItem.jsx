import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import TodoItem from './TodoItem';

export function SortableTodoItem({ todo, index, bulkMode, isSelected, onToggleSelect, viewMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className="relative group/sortable"
    >
      {/* Drag Handle */}
      {!bulkMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>
      )}

      <div className={!bulkMode ? 'pl-8' : ''}>
        <TodoItem
          todo={todo}
          bulkMode={bulkMode}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
        />
      </div>
    </motion.div>
  );
}
