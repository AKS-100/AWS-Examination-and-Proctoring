const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

export const validateRegister = (req, res, next) => {
  const { name, email, password, role, studentId } = req.body;

  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Full name is required');
  } else if (name.trim().length > 60) {
    errors.push('Name cannot exceed 60 characters');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (role && !['teacher', 'student'].includes(role.toLowerCase())) {
    errors.push('Role must be either teacher or student');
  }

  if (role === 'student' && (!studentId || studentId.trim().length === 0)) {
    errors.push('Student ID / Roll Number is required for student registration');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: errors[0],
        allErrors: errors,
        statusCode: 400,
      },
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: errors[0],
        allErrors: errors,
        statusCode: 400,
      },
    });
  }

  next();
};
