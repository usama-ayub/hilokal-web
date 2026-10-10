import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type MessageType = "text" | "correction" | "gift" | "system";

export interface ICorrectionDetails {
  originalText: string;
  correctedText: string;
  explanation?: string;
}

export interface IGiftDetails {
  giftType: string; // e.g. 'coffee', 'rose', 'heart', 'applause', 'trophy'
  giftName: string;
  coinCost: number; // e.g. 50 coins (deducted from sender's free coin balance)
  recipientId: Types.ObjectId;
}

export interface IRoomMessage extends Document {
  roomId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: MessageType;
  content: string;
  correctionDetails?: ICorrectionDetails;
  giftDetails?: IGiftDetails;
  createdAt: Date;
  updatedAt: Date;
}

const RoomMessageSchema = new Schema<IRoomMessage>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },
    type: {
      type: String,
      enum: ["text", "correction", "gift", "system"],
      default: "text",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    correctionDetails: {
      originalText: { type: String },
      correctedText: { type: String },
      explanation: { type: String },
    },
    giftDetails: {
      giftType: { type: String },
      giftName: { type: String },
      coinCost: { type: Number, default: 0 },
      recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
  }
);

// Chronological message stream index
RoomMessageSchema.index({ roomId: 1, createdAt: 1 });

export const RoomMessage: Model<IRoomMessage> =
  mongoose.models.RoomMessage || mongoose.model<IRoomMessage>("RoomMessage", RoomMessageSchema);
