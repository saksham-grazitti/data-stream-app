// ----------------------------------- Modules -----------------------------------
const mysql = require("mysql2/promise");
const User = require("../models/userModel");
const StreamLog = require("../models/streamedModel");


// ----------------------------------- Variables -----------------------------------
const mongoURI = process.env.MONGO_URI;
const BATCH_SIZE = process.env.BATCH_SIZE || 10000;
const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
};


// ----------------------------------- Functions -----------------------------------
async function doStream(req, resp) {
    try {
        const mysqlConn = await mysql.createConnection(mysqlConfig);
        await mongoose.connect(mongoURI);

        const lastLog = await StreamLog.findOne();
        let lastId = lastLog ? lastLog.lastStreamedId : 0;
        let totalStreamed = 0;

        while (true) {
            console.log(`Recording fetching started from ID: ${lastId}`);

            const [rows] = await mysqlConn.execute(`SELECT * FROM users WHERE id > ? LIMIT ?`, [lastId, BATCH_SIZE]);

            if (rows.length === 0) break;

            await User.bulkWrite(rows);
            totalStreamed += rows.length;

            lastId = rows[rows.length - 1].id;
            await StreamLog.updateOne({ lastStreamedId: lastId });
        }

        await mysqlConn.end();
        resp.json({ message: "Streaming completed!", totalStreamed });
    } catch (error) {
        console.error("Streaming Error:", error);
        resp.status(500).json({ error: "Streaming failed" });
    }
}

module.exports = doStream;