import { normalizeRole, isTeacherRole, isStudentRole, ROLES } from '../utils/roles.js';

export const authorize = (...roles) => {
  const normalizedRequiredRoles = roles.map((r) => normalizeRole(r));

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required prior to role verification.',
          statusCode: 401,
        },
      });
    }

    const userCanonicalRole = normalizeRole(req.user.role);

    if (!normalizedRequiredRoles.includes(userCanonicalRole)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          statusCode: 403,
          requiredRoles: roles,
          actualRole: req.user.role,
        },
      });
    }

    next();
  };
};

export const requireTeacher = authorize('teacher', 'proctor');
export const requireStudent = authorize('student');
