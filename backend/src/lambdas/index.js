import signupHandler from './signup.handler.js';
import enrollmentHandler from './enrollment.handler.js';
import sessionHandler from './session.handler.js';
import scoringHandler from './scoring.handler.js';
import examsHandler from './exams.handler.js';
import dashboardHandler from './dashboard.handler.js';

export {
  signupHandler,
  enrollmentHandler,
  sessionHandler,
  scoringHandler,
  examsHandler,
  dashboardHandler,
};

export default {
  signup: signupHandler,
  enrollment: enrollmentHandler,
  session: sessionHandler,
  scoring: scoringHandler,
  exams: examsHandler,
  dashboard: dashboardHandler,
};
