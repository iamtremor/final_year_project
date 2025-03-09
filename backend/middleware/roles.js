 // Middleware for role-based access control
const checkRole = (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
      next();
    };
  };
  
  // Middleware to check if user has any of the specified roles
  const checkRoles = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
      next();
    };
  };
  
  module.exports = { checkRole, checkRoles };
