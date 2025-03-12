// ----------------------------------- Modules -----------------------------------
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const doStreamRoute = require("./routes/doStreamRoute");
const app = express();
dotenv.config();


// ----------------------------------- Variables -----------------------------------
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI;


// ----------------------------------- Middlewares -----------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/stream", doStreamRoute);


// ----------------------------------- Server Configuration -----------------------------------
mongoose.connect(mongoURI).then(() => {
  app.listen(PORT);
  console.log(`Server running on port: ${PORT}`);
}).catch((err) => {
  console.error(err);
});