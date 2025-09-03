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
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      maxAge: 1000 * 60 * 30,
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
  const users_role = "user";
  if (!users_name || !users_password) {
    return res.status(400).send({
      successz: false,
      message: "Username or password cant empty",
    });
  }

  const checkQuery = `SELECT users_name FROM users_table WHERE users_name = '${users_name}' `;
  connection.query(checkQuery, (err, result) => {
    if (err)
      return res.status(500).send({
        success: false,
        message: "Server  error while checking username",
      });
    if (result.length > 0) {
      return res.status(400).send({
        success: false,
        message: "Username already exists!",
      });
    }

    const query = `INSERT INTO users_table (users_name, users_password, users_role) VALUES ('${users_name}', '${users_password}', '${users_role}')`;
    connection.query(query, (err, result) => {
      if (err)
        return res.status(500).send({
          success: false,
          message: "Server error while registering user",
        });
      if (result.affectedRows > 0) {
        res.status(200).send({
          success: true,
          message: "Successfully registered!",
          user: {
            users_id: result.insertId,
            username: users_name,
          },
        });
      } else {
        res.status(400).send({
          success: false,
          message: "Failed to register user!",
        });
      }
    });
  });
});

app.post("/login", async (req, res) => {
  const { users_name, users_password } = req.body;

  if (!users_name || !users_password) {
    return res.status(400).send({
      success: false,
      message: "Username or password can't be empty",
    });
  }

  const query = `SELECT users_id, users_password, users_role FROM users_table WHERE users_name = '${users_name}'`;
  connection.query(query, (err, result) => {
    if (err)
      return res.status(500).send({
        success: false,
        message: "Internal database error",
      });
    if (result.length === 0) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    // console.log(result);
    const storedPassword = result[0].users_password;
    // console.log(storedPassword);

    hashLogin(users_password, storedPassword, (err, isMatch) => {
      if (err) {
        console.log("Error comparing passwords:", err);
        return res.status(500).send({
          success: false,
          message: "Internal error when comparing passwords",
        });
      }
      if (!isMatch) {
        return res.status(401).send({
          success: false,
          message: "Your password is incorrect",
        });
      }
      req.session.loggedin = true;
      req.session.user = {
        id: result[0].users_id,
        username: users_name,
      };
      console.log("User logged in:", req.session);
      return res.status(200).send({
        success: true,
        message: "Login success!",
        user: {
          id: result[0].users_id,
          username: users_name,
          role: result[0].users_role,
        },
      });
    });
  });
});

app.get("/check-session", (req, res) => {
  if (req.session.loggedin) {
    res.json({
      loggedin: req.session.loggedin,
      user: req.session.user,
      role: req.session.user.role,
    });
  } else {
    res.json({
      loggedin: false,
    });
  }
});

app.post("/pesan-makanan", (req, res) => {
  const {
    orders_id,
    orders_customer,
    orders_menu,
    orders_amount,
    orders_total_price,
    orders_status,
  } = req.body;
  const query = `INSERT INTO orders_table (orders_id, orders_customer, orders_menu, orders_amount, orders_total_price, orders_status) VALUES('${orders_id}', '${orders_customer}', '${orders_menu}', '${orders_amount}', '${orders_total_price}', '${orders_status}')`;
  connection.query(query, (err, result) => {
    if (err) {
      console.log("err:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to add order, error from server",
      });
    }
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Success add order!",
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Failed add your order",
      });
    }
  });
});

//endpoint user dan admin
app.get("/daftar-makanan", (req, res) => {
  const query = "SELECT * FROM table_makanan";
  connection.query(query, (err, result) => {
    if (err) {
      console.log("error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Retrived makanan data successfully",
      data: result,
    });
  });
});

//endpoint admin
app.get("/daftar-users", (req, res) => {
  const query = `SELECT * FROM users_table`;
  connection.query(query, (err, result) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Retrived user data successfully",
      data: result,
    });
  });
});

app.post("/tambah-makanan", (req, res) => {
  console.log("Body Received:", req.body);
  const { nama_makanan, harga_makanan, gambar_makanan } = req.body;
  const query = `INSERT INTO table_makanan (nama_makanan, harga_makanan, gambar_makanan) VALUES ('${nama_makanan}', ${harga_makanan}, '${gambar_makanan}')`;
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

app.put("/update-makanan", (req, res) => {
  const { id_makanan, nama_makanan, harga_makanan, gambar_makanan } = req.body;

  if (!id_makanan || !nama_makanan || !harga_makanan || !gambar_makanan) {
    return res.status(404).send("data not found");
  }

  const query = `UPDATE table_makanan 
  SET nama_makanan ='${nama_makanan}', harga_makanan = '${harga_makanan}', gambar_makanan = '${gambar_makanan}' WHERE id_makanan = '${id_makanan}'
  `;

  connection.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("error from server");
    }
    if (result.affectedRows > 0) {
      return res.status(200).send("succes update data!");
    } else {
      return res.status(400).send("failed update data!");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
