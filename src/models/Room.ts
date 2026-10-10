import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type RoomStatus = "active" | "ended";
export type TableType = "casual" | "practice" | "lesson" | "debate";

export interface IRoom extends Document {
  title: string;
  description?: string;
  topicTags: string[];
  primaryLanguage: string;
  targetLevels: string[];
  hostId: Types.ObjectId;
  coHostIds: Types.ObjectId[];
  maxSpeakers: number;
  isPrivate: boolean;
  accessCode?: string;
  tableType: TableType;
  bannerUrl?: string; // 100% Free custom banner upload for all hosts
  status: RoomStatus;
  startedAt: Date;
  endedAt?: Date;
  totalParticipantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    title: {
      type: String,
      required: [true, "Room title is required"],
      trim: true,
      maxlength: [100, "Room title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    topicTags: {
      type: [String],
      default: [],
    },
    primaryLanguage: {
      type: String,
      required: [true, "Primary language is required"],
      trim: true,
      lowercase: true,
      default: "en",
    },
    targetLevels: {
      type: [String],
      default: ["all"],
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host ID is required"],
      index: true,
    },
    coHostIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxSpeakers: {
      type: Number,
      default: 6,
      min: [2, "A room must have at least 2 speaker slots"],
      max: [10, "A room cannot have more than 10 speaker slots"],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    accessCode: {
      type: String,
      default: "",
    },
    tableType: {
      type: String,
      enum: ["casual", "practice", "lesson", "debate"],
      default: "casual",
    },
    bannerUrl: {
      type: String,
      default: "", // Free custom banner
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    totalParticipantsCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for discovering active rooms by language & date
RoomSchema.index({ status: 1, primaryLanguage: 1 });
RoomSchema.index({ status: 1, createdAt: -1 });

export const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
