// Utility functions for reports, date ranges, and CSV export

export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (preset === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (preset === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { startDate: weekAgo.toISOString().split('T')[0], endDate: todayStr };
  }

  if (preset === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: startOfMonth.toISOString().split('T')[0], endDate: todayStr };
  }

  if (preset === 'year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return { startDate: startOfYear.toISOString().split('T')[0], endDate: todayStr };
  }

  // 'all' or default
  return { startDate: '2020-01-01', endDate: '2030-12-31' };
}

export function isDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return false;
  // Compare YYYY-MM-DD strings directly
  const d = dateStr.slice(0, 10);
  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
}

/**
 * Exports data to CSV file with UTF-8 BOM for perfect Excel compatibility with Arabic
 */
export function exportTableToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const sanitize = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(sanitize).join(',');
  const rowLines = rows.map(row => row.map(sanitize).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
