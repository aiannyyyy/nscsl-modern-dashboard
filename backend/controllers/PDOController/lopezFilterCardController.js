const oracleDb = require("oracledb");

exports.getLopezPurchasedFilterCards = async (req, res) => {
  let connection;

  try {
    const { date_from, date_to } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({ error: "date_from and date_to are required." });
    }

    connection = await oracleDb.getConnection();

    const query = `
      SELECT
        rpa.CITY,
        rpa.PROVIDERID  AS SUBMID,
        rpa.DESCR1,
        COUNT(frm.LABID) AS TOTAL_COUNT
      FROM PHMSDS.FILTER_REG_MASTER frm
      JOIN PHMSDS.REF_PROVIDER_ADDRESS rpa
        ON frm.SUBMID = rpa.PROVIDERID
      WHERE rpa.COUNTY = 'QUEZON'
        AND rpa.ADRS_TYPE = '1'
        AND frm.DATE_RELEASED >= TO_TIMESTAMP(:date_from, 'YYYY-MM-DD HH24:MI:SS')
        AND frm.DATE_RELEASED <  TO_TIMESTAMP(:date_to,   'YYYY-MM-DD HH24:MI:SS')
      GROUP BY rpa.CITY, rpa.PROVIDERID, rpa.DESCR1
      ORDER BY rpa.CITY, rpa.PROVIDERID
    `;

    const result = await connection.execute(query, {
      date_from: `${date_from} 00:00:00`,
      date_to:   `${date_to} 23:59:59`,
    }, {
      outFormat: oracleDb.OUT_FORMAT_OBJECT,
    });

    // Group by CITY with breakdown array
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.CITY]) {
        grouped[row.CITY] = {
          city: row.CITY,
          total_count: 0,
          breakdown: [],
        };
      }
      grouped[row.CITY].total_count += row.TOTAL_COUNT;
      grouped[row.CITY].breakdown.push({
        submid: row.SUBMID,
        descr1: row.DESCR1,
        total_count: row.TOTAL_COUNT,
      });
    }

    return res.status(200).json({
      success: true,
      data: Object.values(grouped),
    });

  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Internal server error.", details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
};