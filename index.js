import express from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import bodyParser from "body-parser";
import convert from "./src/routes/convert.js";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(convert);

app.listen(process.env.PORT, () => {
  console.log(`Server is Running at Port ${process.env.PORT}`);
});
