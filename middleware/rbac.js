const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

// Middleware to verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user can access admin panel
const requireAdminAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.canAccessAdmin()) {
    return res.status(403).json({ 
      error: 'Admin access denied',
      message: 'You do not have permission to access the admin panel'
    });
  }

  next();
};

// Middleware to check specific permissions
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ 
        error: 'Permission denied',
        message: `You do not have permission: ${permission}`,
        required: permission,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user has any of the specified roles
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.hasAnyRole(roleArray)) {
      return res.status(403).json({ 
        error: 'Role access denied',
        message: `Required roles: ${roleArray.join(', ')}`,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to check if user is super admin
const requireSuperAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.hasRole('super_admin')) {
    return res.status(403).json({ 
      error: 'Super admin access required',
      message: 'This action requires super admin privileges'
    });
  }

  next();
};

// Helper function to get user permissions for frontend
const getUserPermissions = (user) => {
  if (!user) return [];
  
  const permissions = [];
  
  // Get all possible permissions
  const allPermissions = [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'trips.view', 'trips.create', 'trips.edit', 'trips.delete',
    'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.delete',
    'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.delete',
    'content.view', 'content.create', 'content.edit', 'content.delete',
    'visual_editor.access',
    'system.settings',
    'admin.access'
  ];
  
  // Check which permissions the user has
  allPermissions.forEach(permission => {
    if (user.hasPermission(permission)) {
      permissions.push(permission);
    }
  });
  
  return permissions;
};

module.exports = {
  authenticateToken,
  requireAdminAccess,
  requirePermission,
  requireRole,
  requireSuperAdmin,
  getUserPermissions
};