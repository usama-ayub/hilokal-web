import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type LanguageType = "native" | "learning";
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";

export interface IUserLanguage extends Document {
  userId: Types.ObjectId;
  languageCode: string; // ISO 639-1 code (e.g. 'en', 'es', 'ur', 'ja', 'fr')
  type: LanguageType;
  proficiency: CEFRLevel;
  isPrimaryLearning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserLanguageSchema = new Schema<IUserLanguage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    languageCode: {
      type: String,
      required: [true, "Language code is required"],
      trim: true,
      lowercase: true,
      maxlength: 10,
    },
    type: {
      type: String,
      enum: ["native", "learning"],
      required: [true, "Language type must be 'native' or 'learning'"],
    },
    proficiency: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", "native"],
      default: "A1",
      required: true,
    },
    isPrimaryLearning: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: A user cannot add the same language twice
UserLanguageSchema.index({ userId: 1, languageCode: 1 }, { unique: true });

// Discovery index for language matching
UserLanguageSchema.index({ languageCode: 1, type: 1 });

export const UserLanguage: Model<IUserLanguage> =
  mongoose.models.UserLanguage || mongoose.model<IUserLanguage>("UserLanguage", UserLanguageSchema);
