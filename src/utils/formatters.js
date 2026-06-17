export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

export const formatNumber = (val) =>
  new Intl.NumberFormat('en-IN').format(val || 0);

export const formatDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

export const generateNumber = (prefix, items, key) => {
  const max = items.reduce((m, i) => {
    const n = parseInt((i[key] || '').replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 2024000);
  return `${prefix}-${String(max + 1).padStart(7, '0')}`;
};

export const statusColor = (status) => {
  const map = {
    'Pending': 'warning', 'Approved': 'success', 'Rejected': 'error',
    'In Progress': 'info', 'Completed': 'success', 'Draft': 'default',
    'Sent': 'info', 'Confirmed': 'success', 'Cancelled': 'error',
    'Dispatched': 'info', 'In Transit': 'warning', 'Delivered': 'success',
    'Delayed': 'error', 'Scheduled': 'default', 'Stored': 'success',
    'In Use': 'info', 'Transferred': 'secondary', 'Disposed': 'error',
    'Posted': 'success', 'Accepted': 'success', 'Partially Accepted': 'warning',
    'active': 'success', 'inactive': 'error',
  };
  return map[status] || 'default';
};
