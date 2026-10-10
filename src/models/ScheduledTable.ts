import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type ScheduledTableStatus = "scheduled" | "live" | "completed" | "cancelled";

export interface IScheduledTable extends Document {
  title: string;
  description?: string;
  hostId: Types.ObjectId;
  primaryLanguage: string;
  targetLevels: string[];
  scheduledStartTime: Date;
  estimatedDurationMinutes: number;
  bannerUrl?: string;
  rsvpUserIds: Types.ObjectId[];
  reminderSent: boolean;
  status: ScheduledTableStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledTableSchema = new Schema<IScheduledTable>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host ID is required"],
      index: true,
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
    scheduledStartTime: {
      type: Date,
      required: [true, "Scheduled start time is required"],
      index: true,
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 60,
      min: [15, "Duration must be at least 15 minutes"],
      max: [180, "Duration cannot exceed 180 minutes"],
    },
    bannerUrl: {
      type: String,
      default: "",
    },
    rsvpUserIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reminderSent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for upcoming events discovery
ScheduledTableSchema.index({ scheduledStartTime: 1, status: 1 });

export const ScheduledTable: Model<IScheduledTable> =
  mongoose.models.ScheduledTable || mongoose.model<IScheduledTable>("ScheduledTable", ScheduledTableSchema);
