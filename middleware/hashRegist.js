const bcrypt = require("bcrypt");

const hashPassword = async (req, res, next) => {
  const { password } = req.body;
  if (!password) return res.status(400).send("Password is required!");

  bcrypt.hash(password, 10, (err, hashed) => {
    if (err) return res.status(500).send("Failed to hash password!");
    req.body.password = hashed;
    next();
  });
};

module.exports = hashPassword;
