/**
 * Returns SLA display info for a complaint.
 * Returns null when there is no deadline or the complaint is already closed.
 */
export const getSlaInfo = (complaint) => {
  if (!complaint?.slaDeadline) return null;
  if (['resolved', 'rejected'].includes(complaint.status)) return null;

  const now = new Date();
  const deadline = new Date(complaint.slaDeadline);
  const diff = deadline - now; // ms

  if (diff <= 0) {
    // Overdue — show how long ago it passed
    const totalMins = Math.abs(Math.floor(diff / 60000));
    const totalHours = Math.floor(totalMins / 60);
    const days = Math.floor(totalHours / 24);
    if (days > 0) return { overdue: true, label: `Overdue by ${days}d ${totalHours % 24}h` };
    if (totalHours > 0) return { overdue: true, label: `Overdue by ${totalHours}h ${totalMins % 60}m` };
    return { overdue: true, label: `Overdue by ${totalMins}m` };
  }

  // Time remaining
  const totalHours = Math.floor(diff / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return { overdue: false, label: `${days}d ${hours}h left` };
  if (totalHours > 0) return { overdue: false, label: `${totalHours}h ${mins}m left` };
  return { overdue: false, label: `${mins}m left` };
};
