import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  audioBioUrl?: string;
  bio?: string;
  countryCode?: string;
  isVip: boolean; // 100% Free VIP unlocked for all users
  coinsBalance: number; // Daily complimentary coins for virtual gifting
  currentStreak: number;
  lastActiveAt: Date;
  totalTalkingTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      maxlength: [50, "Display name cannot exceed 50 characters"],
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    audioBioUrl: {
      type: String,
      default: "", // URL to 30-second audio recording
    },
    bio: {
      type: String,
      maxlength: [280, "Bio cannot exceed 280 characters"],
      default: "",
    },
    countryCode: {
      type: String,
      uppercase: true,
      maxlength: 3,
      default: "US",
    },
    isVip: {
      type: Boolean,
      default: true, // VIP Status is 100% FREE for all users
    },
    coinsBalance: {
      type: Number,
      default: 500, // 500 Complimentary Coins upon account registration
      min: [0, "Coins balance cannot be negative"],
    },
    currentStreak: {
      type: Number,
      default: 1,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    totalTalkingTimeMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation in Next.js hot-reload environment
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
