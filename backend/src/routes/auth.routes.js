import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getMe,
  logout,
  getDemoCredentials,
  switchRole,
  syncCognitoSession,
  exchangeCognitoCode,
  cognitoSessionValidationHandler,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireTeacher, requireStudent } from '../middleware/role.middleware.js';
import {
  validateRegister,
  validateLogin,
} from '../middleware/validate.middleware.js';

const router = express.Router();

// Rate limiter for authentication endpoints (prevents brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
      statusCode: 429,
    },
  },
});

// Public authentication routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/cognito/sync', syncCognitoSession);
router.post('/cognito/exchange-code', exchangeCognitoCode);
router.post('/cognito-session', protect, cognitoSessionValidationHandler);
router.get('/demo-credentials', getDemoCredentials);

// Protected routes (Require valid JWT)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/switch-role', protect, switchRole);

// Role-protected test routes for RBAC verification
router.get('/teacher-only', protect, requireTeacher, (req, res) => {
  res.status(200).json({
    success: true,
    message: `Teacher portal accessed successfully by ${req.user.name}.`,
    role: req.user.role,
  });
});

router.get('/student-only', protect, requireStudent, (req, res) => {
  res.status(200).json({
    success: true,
    message: `Student arena accessed successfully by ${req.user.name}.`,
    role: req.user.role,
  });
});

export default router;
