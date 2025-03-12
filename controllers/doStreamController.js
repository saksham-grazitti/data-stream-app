// ----------------------------------- Modules -----------------------------------
const mysql = require("mysql2/promise");
const User = require("../models/userModel");
const StreamLog = require("../models/streamedModel");

// ----------------------------------- Variables -----------------------------------
const BATCH_SIZE = 10000;
const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
};


async function doStream(req, resp) {
    try {
        const mysqlConn = await mysql.createConnection(mysqlConfig);

        // Get last migrated ID from logs
        const lastLog = await MigrationLog.findOne().sort({ lastMigratedId: -1 });
        let lastId = lastLog ? lastLog.lastMigratedId : 0;

        let totalMigrated = 0;

        while (true) {
            console.log(`Fetching records after ID: ${lastId}`);

            const [rows] = await mysqlConn.execute(`SELECT * FROM users WHERE id > ? LIMIT ?`, [lastId, BATCH_SIZE]);

            if (rows.length === 0) break;

            await User.bulkWrite(rows);
            totalMigrated += rows.length;

            // Update migration log
            lastId = rows[rows.length - 1].id;
            await MigrationLog.updateOne({}, { lastMigratedId: lastId }, { upsert: true });

            console.log(`Migrated ${rows.length} records. Last ID: ${lastId}`);
        }

        await mysqlConn.end();
        res.json({ message: "Migration completed!", totalMigrated });
    } catch (error) {
        console.error("Migration Error:", error);
        res.status(500).json({ error: "Migration failed" });
    }
}

module.exports = doStream;