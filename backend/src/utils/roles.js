/**
 * Canonical Application Role Model
 * Normalizes role representations across Cognito, MongoDB, DynamoDB, and JWTs.
 */

export const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  PROCTOR: 'proctor', // Synonym for instructor / review proctor
});

/**
 * Normalizes an arbitrary role string to a canonical role
 * @param {string} role
 * @returns {'student' | 'teacher' | 'proctor'}
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return ROLES.STUDENT;

  const clean = role.trim().toLowerCase();

  if (
    clean === 'teacher' ||
    clean === 'teachers' ||
    clean === 'educator' ||
    clean === 'faculty' ||
    clean === 'instructor' ||
    clean === 'prof' ||
    clean === 'professor'
  ) {
    return ROLES.TEACHER;
  }

  if (clean === 'proctor' || clean === 'proctors' || clean === 'admin') {
    return ROLES.TEACHER; // Teachers act as examination proctors / review authority
  }

  return ROLES.STUDENT;
};

/**
 * Check if a role has teacher / educator privileges
 * @param {string} role
 * @returns {boolean}
 */
export const isTeacherRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === ROLES.TEACHER || normalized === ROLES.PROCTOR;
};

/**
 * Check if a role is a student
 * @param {string} role
 * @returns {boolean}
 */
export const isStudentRole = (role) => {
  return normalizeRole(role) === ROLES.STUDENT;
};
