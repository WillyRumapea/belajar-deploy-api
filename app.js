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

app.post("/tambah-makanan", (req, res) => {
  const { nama_makanan, harga_makanan } = req.body;
  const query = `INSERT INTO table_makanan (nama_makanan, harga_makanan) VALUES ('${nama_makanan}', ${harga_makanan})`;
  connection.query(query, (err, result) => {
    if (err) {
      console.log("error:", err);
      res.status(500).send("error from server");
    }
    if (result.affectedRows > 0) {
      console.log("success add data");
      res.status(200).send("success add data");
    } else {
      res.status(400).send("failed add data");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
