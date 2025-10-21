import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (todos, stats) => {
  const doc = new jsPDF();

  // Add header
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Blue
  doc.text('My Tasks Report', 14, 22);

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

  // Add stats
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary Statistics', 14, 45);

  const statsData = [
    ['Total Tasks', stats.total.toString()],
    ['Completed', stats.completed.toString()],
    ['Pending', stats.pending.toString()],
    ['Completion Rate', `${stats.completionRate}%`],
  ];

  doc.autoTable({
    startY: 50,
    head: [['Metric', 'Value']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14 },
  });

  // Add tasks by priority
  const urgentTasks = todos.filter(t => t.priority === 'urgent' && !t.completed);
  const highTasks = todos.filter(t => t.priority === 'high' && !t.completed);
  const mediumTasks = todos.filter(t => t.priority === 'medium' && !t.completed);
  const lowTasks = todos.filter(t => t.priority === 'low' && !t.completed);

  let currentY = doc.lastAutoTable.finalY + 15;

  if (urgentTasks.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68); // Red
    doc.text('🔥 Urgent Tasks', 14, currentY);

    const urgentData = urgentTasks.map(t => [
      t.title,
      t.category,
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'
    ]);

    doc.autoTable({
      startY: currentY + 5,
      head: [['Task', 'Category', 'Due Date']],
      body: urgentData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  if (highTasks.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(249, 115, 22); // Orange
    doc.text('High Priority Tasks', 14, currentY);

    const highData = highTasks.map(t => [
      t.title,
      t.category,
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'
    ]);

    doc.autoTable({
      startY: currentY + 5,
      head: [['Task', 'Category', 'Due Date']],
      body: highData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: 14 },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Add new page if needed
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  if (mediumTasks.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(234, 179, 8); // Yellow
    doc.text('Medium Priority Tasks', 14, currentY);

    const mediumData = mediumTasks.map(t => [
      t.title,
      t.category,
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'
    ]);

    doc.autoTable({
      startY: currentY + 5,
      head: [['Task', 'Category', 'Due Date']],
      body: mediumData,
      theme: 'striped',
      headStyles: { fillColor: [234, 179, 8] },
      margin: { left: 14 },
    });
  }

  // Save the PDF
  doc.save(`tasks-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToCSV = (todos) => {
  const headers = ['Title', 'Description', 'Category', 'Priority', 'Status', 'Due Date', 'Created', 'Completed'];

  const rows = todos.map(todo => [
    `"${todo.title.replace(/"/g, '""')}"`,
    `"${(todo.description || '').replace(/"/g, '""')}"`,
    todo.category,
    todo.priority,
    todo.completed ? 'Completed' : 'Pending',
    todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '',
    new Date(todo.createdAt).toLocaleDateString(),
    todo.completedAt ? new Date(todo.completedAt).toLocaleDateString() : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportToJSON = (todos) => {
  const jsonContent = JSON.stringify(todos, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
};
