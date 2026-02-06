const LAB_DEFAULT_CRITICAL_THRESHOLD = 10;
const LAB_DEFAULT_WARNING_THRESHOLD = 20;

const itemThresholds = {
  LAB002: { critical: 1000, warning: 1200, unit: 'pcs' },
  LAB003: { critical: 3, warning: 5, unit: 'boxes' },
  LAB004: { critical: 5, warning: 7, unit: 'boxes' },
  LAB008: { critical: 2, warning: 4, unit: 'boxes' },
  LAB010: { critical: 4, warning: 6, unit: 'boxes' },
  LAB012: { critical: 2, warning: 4, unit: 'boxes' },
  LAB013: { critical: 2, warning: 4, unit: 'boxes' },
  LAB015: { critical: 1, warning: 2, unit: 'box' },
  LAB034: { critical: 2, warning: 4, unit: 'rolls' },
  LAB035: { critical: 1, warning: 2, unit: 'box' },
  LAB047: { critical: 0.5, warning: 1, unit: 'pack' },
  LAB051: { critical: 0.5, warning: 1, unit: 'pack' },
  LAB049: { critical: 110, warning: 130, unit: 'plates' },
  LAB052: { critical: 2, warning: 4, unit: 'boxes' },
  LAB062: { critical: 1, warning: 2, unit: 'pack' },
  LAB064: { critical: 1, warning: 2, unit: 'box' },
  LAB068: { critical: 20, warning: 40, unit: 'boxes' },
  LAB071: { critical: 1, warning: 2, unit: 'pack' },
  LAB073: { critical: 1, warning: 2, unit: 'pack' },
  LAB080: { critical: 1, warning: 2, unit: 'pack' },
  LAB081: { critical: 1, warning: 2, unit: 'pack' },
  LAB128: { critical: 1, warning: 2, unit: 'pack' },
  LAB129: { critical: 0.6, warning: 1.2, unit: 'pack' },
  LAB130: { critical: 1, warning: 2, unit: 'pack' },
};

module.exports = {
  LAB_DEFAULT_CRITICAL_THRESHOLD,
  LAB_DEFAULT_WARNING_THRESHOLD,
  itemThresholds,
};
