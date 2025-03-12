// ----------------------------------- Modules -----------------------------------
const express = require("express");
const dotenv = require("dotenv");
const doStreamRoute = require("./routes/doStreamRoute");
const app = express();
dotenv.config();


// ----------------------------------- Variables -----------------------------------
const PORT = process.env.PORT || 3000;


// ----------------------------------- Middlewares -----------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/stream", doStreamRoute);


// ----------------------------------- Server Configuration -----------------------------------
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});