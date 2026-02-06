const { database } = require('../../config');

// Thresholds
const REAGENT_DEFAULT_CRITICAL_THRESHOLD = 10;
const REAGENT_DEFAULT_WARNING_THRESHOLD = 20;

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

// Helper function to determine status
const getReagentStatus = (itemCode, stock) => {
    const threshold = itemThresholds[itemCode] || {
        critical: REAGENT_DEFAULT_CRITICAL_THRESHOLD,
        warning: REAGENT_DEFAULT_WARNING_THRESHOLD
    };

    if (stock <= 0) return 'out-of-stock';
    if (stock <= threshold.critical) return 'critical';
    if (stock <= threshold.warning) return 'warning';
    return 'normal';
};

// Helper function to get unit
const getReagentUnit = (itemCode) => {
    return itemThresholds[itemCode]?.unit || 'units';
};

// Helper function to get thresholds
const getReagentThresholds = (itemCode) => {
    return itemThresholds[itemCode] || {
        critical: REAGENT_DEFAULT_CRITICAL_THRESHOLD,
        warning: REAGENT_DEFAULT_WARNING_THRESHOLD,
        unit: 'units'
    };
};

exports.getLabReagents = async (req, res) => {
    try {
        const sql = `
            SELECT
                itemcode       AS itemCode,
                description,
                stocks_on_hand AS stock
            FROM inventory.reagents
            ORDER BY itemcode ASC
        `;

        const [rows] = await database.mysqlPool.query(sql);

        // Add status, unit, and thresholds to each reagent
        const enrichedData = rows.map(reagent => {
            const stock = Number(reagent.stock);
            const thresholds = getReagentThresholds(reagent.itemCode);
            
            return {
                itemCode: reagent.itemCode,
                description: reagent.description,
                stock: stock,
                unit: thresholds.unit,
                status: getReagentStatus(reagent.itemCode, stock),
                thresholds: thresholds
            };
        });

        console.log('📊 Total reagents:', enrichedData.length);
        console.log('📊 Sample reagents:');
        enrichedData.slice(0, 3).forEach(item => {
            console.log(`  ${item.itemCode}: stock=${item.stock}, critical=${item.thresholds.critical}, warning=${item.thresholds.warning}, status=${item.status}`);
        });

        res.json({
            success: true,
            count: enrichedData.length,
            data: enrichedData,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('❌ Lab Reagents Controller Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch laboratory reagents',
        });
    }
};