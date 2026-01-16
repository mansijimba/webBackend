module.exports = (requiredRole) => {
  return (req, res, next) => {
    if (!req.auth || req.auth.role !== requiredRole) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
