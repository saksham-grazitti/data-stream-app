const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    created_at: Date,
});

const User = mongoose.model("User", userSchema);
module.exports = User;