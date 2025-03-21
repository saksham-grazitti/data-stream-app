// ----------------------------------- Modules -----------------------------------
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/userModel");
const StreamLog = require("../models/streamedModel");
dotenv.config();


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
            console.log(`Data fetching started from ID: ${lastId}`);

            const [rows] = await mysqlConn.execute(`SELECT * FROM users WHERE id > ? LIMIT ?`, [lastId, BATCH_SIZE]);

            if (rows.length === 0) break;

            await User.bulkWrite(rows.map(doc => ({
                insertOne: { document: doc }
            })));

            totalStreamed += rows.length;

            let updatedId = rows[rows.length - 1].id;;
            await StreamLog.updateOne({ lastStreamedId: lastId }, { $set: { lastStreamedId: updatedId } }, { upsert: true });
            lastId = updatedId;
        }

        await mysqlConn.end();
        resp.json({ message: "Streaming completed!", totalStreamed });
    } catch (error) {
        console.error("Streaming Error:", error);
        resp.status(500).json({ error: "Streaming failed" });
    }
}

module.exports = doStream;