const bcrypt = require("bcrypt");

const hashLogin = (inputPassword, storedPassword, callback) => {
  bcrypt.compare(inputPassword, storedPassword, (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

module.exports = hashLogin;
