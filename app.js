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
const hashPassword = require("./middleware/hashRegist");

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

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(`Error destroy session ${err}`);
      return res.status(500).json({
        success: false,
        message: "Failed logout",
      });
    }

    res.clearCookie("connect.sid", { path: "/" });

    return res.status(200).json({
      success: true,
      message: "Success logout",
    });
  });
});

app.post("/pesan-makanan", (req, res) => {
  const {
    orders_id,
    orders_customer,
    orders_menu,
    orders_amount,
    orders_total_price,
  } = req.body;
  const query = `INSERT INTO orders_table (orders_id, orders_customer, orders_menu, orders_amount, orders_total_price) VALUES('${orders_id}', '${orders_customer}', '${orders_menu}', '${orders_amount}', '${orders_total_price}')`;
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

app.get("/daftar-pesanan", (req, res) => {
  const query = "SELECT * FROM orders_table";
  connection.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: "Retrived order data successfully!",
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

app.delete("/hapus-makanan/:id_makanan", (req, res) => {
  const { id_makanan } = req.params;
  if (!id_makanan) {
    return res.status(400).json({
      success: false,
      message: "undefined id_makanan",
    });
  }
  const query = `DELETE FROM table_makanan WHERE id_makanan = ${id_makanan}`;
  connection.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Internal server error!",
        error: err,
      });
    }
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Success delete data makanan!",
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Failed delete data makanan!",
      });
    }
  });
});

app.put("/update-user", hashPassword, (req, res) => {
  const { users_id, users_name, users_password, users_role } = req.body;

  if (!users_id || !users_name || !users_password || !users_role) {
    return res.status(400).send("cant update while field undefined");
  }

  const query = `UPDATE users_table SET users_name = '${users_name}', users_password = '${users_password}', users_role = '${users_role}' WHERE users_id = '${users_id}'`;

  connection.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "internal server error",
        error: err,
      });
    }
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Success update data user!",
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to update data user!",
      });
    }
  });
});

app.delete("/hapus-user/:users_id", (req, res) => {
  const { users_id } = req.params;

  if (!users_id) {
    return res.status(400).json({
      success: false,
      message: "Undefined users id",
    });
  }

  const query = `DELETE FROM users_table WHERE users_id = ${users_id}`;
  connection.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Success delete data user",
        result: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Failed delete data user",
      });
    }
  });
});

app.put("/update-order", (req, res) => {
  const {
    orders_id,
    orders_customer,
    orders_menu,
    orders_amount,
    orders_total_price,
    orders_status,
  } = req.body;
  console.log(req.body);

  if (
    !orders_id ||
    !orders_customer ||
    !orders_menu ||
    !orders_amount ||
    !orders_total_price ||
    orders_status === undefined ||
    orders_status === null
  ) {
    return res.status(404).send("cant update while field undifined!");
  }

  const query = `UPDATE orders_table SET orders_customer = '${orders_customer}', orders_menu = '${orders_menu}', orders_amount = '${orders_amount}', orders_total_price = '${orders_total_price}', orders_status = '${orders_status}' WHERE orders_id = '${orders_id}'`;

  connection.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err,
      });
    }
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Success update data order!",
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Failed to update data order",
      });
    }
  });
});

app.delete("/hapus-order/:orders_id", (req, res) => {
  const { orders_id } = req.params;

  if (!orders_id) {
    return res.status(400).json({
      success: false,
      message: "Undefined orders id",
    });
  }

  const query = `DELETE FROM orders_table WHERE orders_id = ${orders_id}`;
  connection.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Success delete data order",
        result: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Failed delete data order",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
