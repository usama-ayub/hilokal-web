import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type TransactionType =
  | "initial_signup"
  | "daily_login_bonus"
  | "streak_reward"
  | "sent_gift"
  | "received_gift"
  | "host_tip";

export interface ICoinTransaction extends Document {
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number; // Positive for incoming coins, negative for outgoing/spent coins
  balanceAfter: number;
  relatedUserId?: Types.ObjectId;
  relatedRoomId?: Types.ObjectId;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "initial_signup",
        "daily_login_bonus",
        "streak_reward",
        "sent_gift",
        "received_gift",
        "host_tip",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: [0, "Balance cannot be negative"],
    },
    relatedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    relatedRoomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching user transaction history in chronological order
CoinTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CoinTransaction: Model<ICoinTransaction> =
  mongoose.models.CoinTransaction ||
  mongoose.model<ICoinTransaction>("CoinTransaction", CoinTransactionSchema);
