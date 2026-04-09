// SLA deadlines in days per complaint category
const SLA_DAYS = {
  mess: 1,
  hostel: 3,
  classroom: 2,
  department: 2,
  campus: 2,
  ground: 3,
  medical_aid_centre: 1,
  security: 1,
  others: 3,
};

/**
 * Compute the SLA deadline Date for a given category.
 * Falls back to the 'others' duration for unknown categories.
 */
const computeSlaDeadline = (category) => {
  const days = SLA_DAYS[category] ?? SLA_DAYS.others;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline;
};

module.exports = { SLA_DAYS, computeSlaDeadline };
