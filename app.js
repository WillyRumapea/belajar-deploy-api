const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const connection = require("./controller/conn");

app.get("/", (req, res) => {
  res.send("API Ready!");
});

app.get("/daftar-makanan", (req, res) => {
  const query = "SELECT * FROM table_makanan";
  connection.query(query, (err, result) => {
    if (err) {
      console.log("error:", err);
      res.status(500).send("Error to get data");
    } else {
      res.send(result);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
