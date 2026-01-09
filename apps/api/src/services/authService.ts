import jwt from 'jsonwebtoken';
import { UserModel, RefreshTokenModel, IUser } from '@smartlearn/database';
import { generateId } from '@smartlearn/shared';
import { AppError } from '../middlewares/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}

export function generateTokens(user: IUser) {
  const payload = {
    userId: user.user_id,
    email: user.email,
    role: user.role,
    campus: user.campus,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRY as unknown as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ userId: user.user_id }, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRY as unknown as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('Account is inactive or suspended', 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = generateTokens(user);

  await RefreshTokenModel.create({
    user_id: user.user_id,
    token: tokens.refreshToken,
    expires_at: new Date(Date.now() + parseExpiry(REFRESH_EXPIRY)),
  });

  user.last_login = new Date();
  await user.save();

  return {
    ...tokens,
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      campus: user.campus,
      department: user.department,
      avatar_url: user.avatar_url,
      status: user.status,
      created_at: user.created_at,
    },
  };
}

export async function register(data: {
  email: string;
  password: string;
  full_name: string;
  campus: string;
  department: string;
  role?: string;
}) {
  const existingUser = await UserModel.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const user = await UserModel.create({
    user_id: generateId('USR'),
    email: data.email.toLowerCase(),
    password_hash: data.password,
    full_name: data.full_name,
    role: data.role || 'student',
    campus: data.campus,
    department: data.department,
    status: 'active',
  });

  const tokens = generateTokens(user);

  await RefreshTokenModel.create({
    user_id: user.user_id,
    token: tokens.refreshToken,
    expires_at: new Date(Date.now() + parseExpiry(REFRESH_EXPIRY)),
  });

  return {
    ...tokens,
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      campus: user.campus,
      department: user.department,
      status: user.status,
      created_at: user.created_at,
    },
  };
}

export async function refreshTokens(refreshToken: string) {
  const stored = await RefreshTokenModel.findOne({ token: refreshToken });
  if (!stored || stored.expires_at < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await UserModel.findOne({ user_id: stored.user_id });
  if (!user || user.status !== 'active') {
    throw new AppError('User not found or inactive', 401);
  }

  await RefreshTokenModel.deleteOne({ _id: stored._id });

  const tokens = generateTokens(user);

  await RefreshTokenModel.create({
    user_id: user.user_id,
    token: tokens.refreshToken,
    expires_at: new Date(Date.now() + parseExpiry(REFRESH_EXPIRY)),
  });

  return tokens;
}

export async function logout(refreshToken: string) {
  await RefreshTokenModel.deleteOne({ token: refreshToken });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await UserModel.findOne({ user_id: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password_hash = newPassword;
  await user.save();

  await RefreshTokenModel.deleteMany({ user_id: userId });
}
