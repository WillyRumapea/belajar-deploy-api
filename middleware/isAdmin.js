function isAdmin(req, res, next) {
  if (!req.session.loggedin) {
    return res.status(401).json({
      success: false,
      message: "You must login first",
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can access",
    });
  }

  next();
}

module.exports = isAdmin;
