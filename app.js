require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const connection = require("./controller/conn");
const bodyParser = require("body-parser");
const cors = require("cors");
const generateToken = require("./routes/generate-token");
const session = require("express-session");
const hasgRegist = require("./middleware/hashRegist");
const hashLogin = require("./middleware/hashLogin");

app.set("trust proxy", 1);
app.use(bodyParser.json());
app.use(
  cors({
    origin: "https://belajar-deploy-fe.vercel.app",
    credential: true,
  })
);
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: "none",
    },
  })
);
app.use("/api", generateToken);

app.get("/", (req, res) => {
  res.send("API Ready!");
});

app.post("/regist", hasgRegist, (req, res) => {
  const { users_name, users_password } = req.body;
  if (!users_name || !users_password) {
    return res.status(400).send("username or password can't be empty");
  }

  const checkQuery = `SELECT users_name FROM users_table WHERE users_name = '${users_name}' `;
  connection.query(checkQuery, (err, result) => {
    if (err) return res.status(500).send("Server  error while checking user");
    if (result.length > 0) {
      return res.status(400).send("Username already exists!");
    }

    const query = `INSERT INTO users_table (users_name, users_password) VALUES ('${users_name}', '${users_password}')`;
    connection.query(query, (err, result) => {
      if (err)
        return res.status(500).send("Server error while registering user");
      if (result.affectedRows > 0) {
        res.status(200).send("Successfully registered!");
      } else {
        res.status(400).send("Failed to register user!");
      }
    });
  });
});

app.post("/login", async (req, res) => {
  const { users_name, users_password } = req.body;

  if (!users_name || !users_password) {
    return res.status(400).send("username or password can't be empty");
  }

  const query = `SELECT users_id, users_password FROM users_table WHERE users_name = '${users_name}'`;
  connection.query(query, (err, result) => {
    if (err) return res.status(500).send("Internal database error");
    if (result.length === 0) {
      return res.status(404).send("User not found");
    }
    const storedPassword = result[0].password;
    console.log(storedPassword);

    hashLogin(users_password, storedPassword, (err, isMatch) => {
      if (err) {
        console.log("Error comparing passwords:", err);
        return res.status(500).send("Internal error when comparing passwords");
      }
      if (!isMatch) {
        return res.status(401).send("Wrong password");
      }
      req.session.loggedin = true;
      req.session.user = {
        id: result[0].users_id,
        username: users_name,
      };
      console.log("User logged in:", req.session);
      return res.status(200).send("login success!");
    });
  });
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
  console.log("Body Received:", req.body);
  const { nama_makanan, harga_makanan } = req.body;
  const query = `INSERT INTO table_makanan (nama_makanan, harga_makanan) VALUES ('${nama_makanan}', ${harga_makanan})`;
  connection.query(query, (err, result) => {
    if (err) {
      console.log("error:", err);
      res.status(500).send("error from server", err);
    }
    if (result.affectedRows > 0) {
      res.status(200).send("succes add data!");
    } else {
      res.status(400).send("failed add data!");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
