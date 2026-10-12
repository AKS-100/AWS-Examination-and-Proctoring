import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    cognitoSub: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
      default: null,
    },
    password: {
      type: String,
      required: false, // Cognito manages passwords; never store passwords for Cognito users
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Never return password by default
    },
    role: {
      type: String,
      enum: {
        values: ['teacher', 'student', 'proctor'],
        message: 'Role must be teacher, student, or proctor',
      },
      default: 'student',
    },
    studentId: {
      type: String,
      trim: true,
      default: null,
    },
    faceIds: {
      type: [String],
      default: [],
    },
    baselineImageKeys: {
      type: [String],
      default: [],
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export Mongoose Model
export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
