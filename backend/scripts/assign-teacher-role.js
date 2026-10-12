#!/usr/bin/env node

/**
 * AdaptiveExam Administrator CLI: Role Verification & Assignment Tool
 * 
 * Usage:
 *   node scripts/assign-teacher-role.js <email> [teacher|student]
 * 
 * Example:
 *   node scripts/assign-teacher-role.js stasissoftwarepvtltd@gmail.com teacher
 */

import { connectDB } from '../src/config/db.js';
import {
  findUserByEmail,
  updateUserRole,
  addTrustedTeacherEmail,
} from '../src/services/user.service.js';
import { ROLES, normalizeRole } from '../src/utils/roles.js';

const targetEmail = process.argv[2];
const requestedRole = process.argv[3] || 'teacher';

if (!targetEmail) {
  console.error('Error: Please provide a target email address.');
  console.log('Usage: node scripts/assign-teacher-role.js <email> [teacher|student]');
  process.exit(1);
}

const run = async () => {
  await connectDB();

  const cleanEmail = targetEmail.trim().toLowerCase();
  const canonicalRole = normalizeRole(requestedRole);

  console.log(`\n======================================================`);
  console.log(` AdaptiveExam Institutional Account Role Administrator `);
  console.log(`======================================================`);
  console.log(` Target Account: ${cleanEmail}`);
  console.log(` Target Role:    ${canonicalRole}`);
  console.log(`------------------------------------------------------`);

  // Check current user state
  const existingUser = await findUserByEmail(cleanEmail);

  if (existingUser) {
    console.log(` Current State:`);
    console.log(`   - ID:         ${existingUser._id || existingUser.studentId}`);
    console.log(`   - Name:       ${existingUser.name}`);
    console.log(`   - CognitoSub: ${existingUser.cognitoSub || 'None (local / not linked)'}`);
    console.log(`   - Role:       ${existingUser.role}`);
    console.log(`   - Status:     ${existingUser.status}`);
  } else {
    console.log(` Note: No database profile currently exists for ${cleanEmail}.`);
    console.log(` Adding to Pre-Authorized Institutional Teacher Registry.`);
  }

  // Update in trusted registry and database
  if (canonicalRole === ROLES.TEACHER) {
    addTrustedTeacherEmail(cleanEmail);
    console.log(` [Registry]: Added ${cleanEmail} to Trusted Teacher Emails.`);
  }

  const updatedUser = await updateUserRole(cleanEmail, canonicalRole);

  if (updatedUser) {
    console.log(`\n Result: SUCCESS!`);
    console.log(`   - Email:      ${updatedUser.email}`);
    console.log(`   - Role:       ${updatedUser.role}`);
    console.log(`   - Status:     ${updatedUser.status}`);
    console.log(`   - Department: ${updatedUser.department}`);
    console.log(` Account is now verified as an authorized ${canonicalRole.toUpperCase()}.`);
  } else {
    console.log(` Pre-authorization recorded. When ${cleanEmail} signs in via Cognito,`);
    console.log(` they will be synchronized directly as an authorized ${canonicalRole.toUpperCase()}.`);
  }

  console.log(`======================================================\n`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Fatal error during role assignment:', err);
  process.exit(1);
});
