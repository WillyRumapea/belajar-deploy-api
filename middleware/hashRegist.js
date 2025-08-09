const bcrypt = require("bcrypt");

const hashPassword = async (req, res, next) => {
  const { users_password } = req.body;
  if (!users_password) return res.status(400).send("Password is required!");

  bcrypt.hash(users_password, 10, (err, hashed) => {
    if (err) return res.status(500).send("Failed to hash password!");
    req.body.users_password = hashed;
    next();
  });
};

module.exports = hashPassword;
