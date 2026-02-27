const oracledb = require('oracledb');

exports.displayUsers = async (req, res) => {
    let connection;

    try {
        const { userID } = req.params;

        if (!userID || isNaN(userID)) {
            return res.status(400).json({
                success: false,
                message: "Valid numeric userID is required"
            });
        }

        const oraclePool = req.app.locals.oracleDb;

        if (!oraclePool) {
            return res.status(500).json({
                success: false,
                message: "Oracle pool not initialized"
            });
        }

        connection = await oraclePool.getConnection();

        const result = await connection.execute(
            `
            SELECT user_id,
                   firstname,
                   middleinit,
                   lastname,
                   username
            FROM phsecure.users
            WHERE user_id = :user_id
            `,
            { user_id: Number(userID) }, // 🔥 parameterized bind variable
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
};