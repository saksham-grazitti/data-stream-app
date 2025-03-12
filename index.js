// ----------------------------------- Modules -----------------------------------
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = express();
dotenv.config();


// ----------------------------------- Variables -----------------------------------
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI;


// ----------------------------------- Server Configuration -----------------------------------
mongoose.connect(mongoURI).then(() => {
  app.listen(PORT);
  console.log(`Server running on port: ${PORT}`);
}).catch((err) => {
  console.error(err);
});