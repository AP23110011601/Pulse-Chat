const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.JWT_EXPIRES_IN = '7d';
  }

  generateToken(userId) {
    return jwt.sign({ id: userId }, this.JWT_SECRET, { 
      expiresIn: this.JWT_EXPIRES_IN 
    });
  }

  sanitizeUser(user) {
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      status: user.status,
      role: user.role || 'user',
      isBlocked: user.isBlocked || false,
      theme: user.theme || 'dark',
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    };
  }

  async register({ username, email, password, bio }) {
    // Validation
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role (first user or admin email gets admin role)
    const userCount = await User.countDocuments();
    const role = userCount === 0 || email.toLowerCase() === 'admin@pulsechat.com' 
      ? 'admin' 
      : 'user';

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      bio: bio || 'Learning Full Stack Development',
      status: 'online',
      role,
    });

    const token = this.generateToken(user._id);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new Error('Your account is blocked');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new Error('Invalid email or password');
    }

    // Update status to online
    user.status = 'online';
    await user.save();

    const token = this.generateToken(user._id);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isBlocked) {
      throw new Error('Your account is blocked');
    }

    return this.sanitizeUser(user);
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { status: 'offline' });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('No account found');
    }

    // In production, send actual email with reset link
    return { message: 'Password reset link sent' };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();
