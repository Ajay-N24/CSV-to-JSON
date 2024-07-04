import { Router } from "express";
import { fileURLToPath } from "url";
// import data from "./Data.csv";
import fs from "fs";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var outPath = path.join(__dirname, "customer-data.json");
const dataPath = path.join(__dirname, "Data.csv");
const router = Router();
import pool from "../../Db.js";

async function saveJsonData(jsonData) {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query("BEGIN");
    // Example table and columns
    const insertQuery = `
      INSERT INTO users (name, age, address, additional-info)
      VALUES ($1, $2, $3, $4)
    `;
    for (const data of jsonData) {
      await client.query(insertQuery, [
        data.name,
        data.age,
        data.address,
        data.gender,
      ]);
    }
    await client.query("COMMIT");
    console.log("Data saved successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving data:", error);
  } finally {
    client.release();
  }
}

router.post("/csvToJson", async (req, res) => {
  let jsonObject = {};
  const d = fs.readFile(dataPath, "utf-8", (err, data) => {
    if (err) console.log(err);
    else {
      const Cleandata = data.replace(/\r/g, "");
      var dataArray = Cleandata.split("\n");
      var fieldsArray = dataArray[0].split(",");
      for (var i = 1; i < dataArray.length; i++) {
        var valuesArray = dataArray[i].split(",");
        for (var k = 0; k < valuesArray.length; k++) {
          if (fieldsArray[k].includes(".")) {
            const tempArray = fieldsArray[k].split(".");
            if (k != 0 && k != 3) {
              const previousArray = fieldsArray[k - 1].split(".");
              if (tempArray[0] == previousArray[0]) {
                jsonObject[tempArray[0]] = {
                  ...jsonObject[previousArray[0]],
                  [tempArray[1]]: valuesArray[k],
                };
              }
            } else {
              jsonObject[tempArray[0]] = { [tempArray[1]]: valuesArray[k] };
            }
          } else {
            jsonObject[fieldsArray[k]] = valuesArray[k];
          }
        }
      }
      saveJsonData(jsonObject);
      res.send(jsonObject);
      const query = `
      SELECT name, age, address, additional_info, id
      FROM users
      WHERE age < 20
      UNION ALL
      SELECT name, age, address, additional_info, id
      FROM users
      WHERE age BETWEEN 20 AND 40
      UNION ALL
      SELECT name, age, address, additional_info, id
      FROM users
      WHERE age BETWEEN 41 AND 60
      UNION ALL
      SELECT name, age, address, additional_info, id
      FROM users
      WHERE age > 60
      `;
      const result = await client.query(query);
      console.log(result.rows);
      fs.writeFile(
        outPath,
        JSON.stringify(jsonObject, null, 2),
        function (err) {
          if (err) {
            return console.log(err);
          }
          console.log("Created A JSON File!");
        }
      );
    }
  });
});
export default router;
