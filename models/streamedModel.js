const mongoose = require("mongoose");

const streamLogSchema = new mongoose.Schema({
    lastStreamedId: Number,
    timestamp: { type: Date, default: Date.now },
});

const StreamLog = mongoose.model("StreamLog", streamLogSchema);
module.exports = StreamLog;