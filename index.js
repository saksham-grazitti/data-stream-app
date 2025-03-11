require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// MySQL Connection
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define MongoDB Schemas
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Prevent duplicate inserts
  name: String,
  email: String,
  created_at: Date,
});

const migrationLogSchema = new mongoose.Schema({
  lastMigratedId: Number, // Keep track of the last migrated record
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const MigrationLog = mongoose.model("MigrationLog", migrationLogSchema);

// Batch Migration Settings
const BATCH_SIZE = 10000; // Adjust batch size based on your system resources

// Migration Route
app.get("/migrate", async (req, res) => {
  try {
    // Connect to MySQL
    const mysqlConn = await mysql.createConnection(mysqlConfig);

    // Get last migrated ID from logs
    const lastLog = await MigrationLog.findOne().sort({ lastMigratedId: -1 });
    let lastId = lastLog ? lastLog.lastMigratedId : 0;

    let totalMigrated = 0;

    while (true) {
      console.log(`Fetching records after ID: ${lastId}`);
      
      // Fetch data in batches
      const [rows] = await mysqlConn.execute(
        `SELECT id, name, email, created_at FROM users WHERE id > ? ORDER BY id ASC LIMIT ?`,
        [lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break; // Stop if no more data

      // Insert into MongoDB with upsert (prevents duplicates)
      const bulkOps = rows.map((row) => ({
        updateOne: {
          filter: { id: row.id },
          update: { $set: row },
          upsert: true, // Insert if not exists
        },
      }));

      await User.bulkWrite(bulkOps);
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
});

// Start Express Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
