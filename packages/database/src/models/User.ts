import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'lecturer', 'student'],
      default: 'student',
      index: true,
    },
    campus: {
      type: String,
      enum: ['hanoi', 'danang', 'hcm'],
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
    },
    avatar_url: String,
    last_login: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    preferences: {
      language: { type: String, default: 'vi' },
      notifications: { type: Boolean, default: true },
      theme: { type: String, default: 'light' },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

UserSchema.index({ campus: 1, role: 1 });
UserSchema.index({ department: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  
  if (!this.password_hash.startsWith('$2')) {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

UserSchema.set('toJSON', {
  transform: function(_doc, ret) {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj['password_hash'];
    return obj;
  },
});

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export { UserSchema as User };
