const { database } = require('../../config');
const { itemThresholds } = require('../../config/labThresholds');

exports.getLabSupplies = async (req, res) => {
  try {
    const sql = `
      SELECT
        itemcode       AS itemCode,
        description,
        stocks_on_hand AS stock
      FROM inventory.lab_supplies
      ORDER BY itemcode ASC
    `;

    const [rows] = await database.mysqlPool.query(sql);

    // Enhance rows with threshold data and status
    const enhancedRows = rows.map(item => {
      const stock = Number(item.stock);
      const thresholds = itemThresholds[item.itemCode] || {
        critical: 10,
        warning: 20,
        unit: 'units'
      };
      
      // Determine status
      let status = 'normal';
      if (stock <= 0) status = 'out-of-stock';
      else if (stock <= thresholds.critical) status = 'critical';
      else if (stock <= thresholds.warning) status = 'warning';
      
      return {
        ...item,
        thresholds: thresholds,
        status: status,
        unit: thresholds.unit
      };
    });

    console.log('📊 Total supplies:', enhancedRows.length);
    console.log('📊 Sample items:');
    enhancedRows.slice(0, 3).forEach(item => {
      console.log(`  ${item.itemCode}: stock=${item.stock}, critical=${item.thresholds.critical}, warning=${item.thresholds.warning}, status=${item.status}`);
    });

    res.json({
      success: true,
      count: enhancedRows.length,
      data: enhancedRows,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Lab Supplies Controller Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch laboratory supplies',
    });
  }
};