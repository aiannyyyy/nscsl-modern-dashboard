const REAGENT_DEFAULT_CRITICAL_TRESHOLD = 10;
const REAGENT_DEFAULT_WARNING_TRESHOLD = 20;

const itemThresholds = {
    'REA005': {critical: 5, warning: 7, unit:'boxes'},
    'REA006': {critical: 10, warning: 12, unit:'kits'},
    'REA007': {critical: 10, warning: 12, unit:'kits'},
    'REA008': {critical: 5, warning: 7, unit:'boxes'},
    'REA019': {critical: 10, warning: 12, unit:'kits'},
    'REA025': {critical: 2, warning: 4, unit:'bottles'},
    'REA028': {critical: 15, warning: 17, unit:'kits'},
    'REA029': {critical: 10, warning: 12, unit:'kits'},
    'REA030': {critical: 15, warning: 17, unit:'kits'},
    'REA031': {critical: 15, warning: 17, unit:'kits'},
    'REA032': {critical: 10, warning: 12, unit:'kits'},
    'REA033': {critical: 15, warning: 17, unit:'kits'},
    'REA036': {critical: 2, warning: 4, unit:'bottles'},
    'REA051': {critical: 1, warning: 2, unit:'box'},
    'REA052': {critical: 1, warning: 2, unit:'box'},
    'REA053': {critical: 10, warning: 12, unit:'kits'},
    'REA054': {critical: 10, warning: 12, unit:'kits'},
    'REA057': {critical: 0.25, warning: 0.50, unit:'bottle'},
};

module.exports = {
    REAGENT_DEFAULT_CRITICAL_TRESHOLD,
    REAGENT_DEFAULT_WARNING_TRESHOLD,
    itemThresholds
};