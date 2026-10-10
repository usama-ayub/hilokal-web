import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IVocabularyWord {
  word: string;
  definition: string;
  exampleSentence: string;
  translation?: string;
}

export interface IGrammarTip {
  original: string;
  suggestion: string;
  rule: string;
}

export interface IAiSummary extends Document {
  roomId: Types.ObjectId;
  hostId: Types.ObjectId;
  title: string;
  summaryMarkdown: string;
  topicsDiscussed: string[];
  vocabularyWords: IVocabularyWord[];
  grammarTips: IGrammarTip[];
  keyPhrases: string[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AiSummarySchema = new Schema<IAiSummary>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Summary title is required"],
      trim: true,
    },
    summaryMarkdown: {
      type: String,
      required: [true, "Summary content is required"],
    },
    topicsDiscussed: {
      type: [String],
      default: [],
    },
    vocabularyWords: [
      {
        word: { type: String, required: true },
        definition: { type: String, required: true },
        exampleSentence: { type: String, required: true },
        translation: { type: String },
      },
    ],
    grammarTips: [
      {
        original: { type: String, required: true },
        suggestion: { type: String, required: true },
        rule: { type: String, required: true },
      },
    ],
    keyPhrases: {
      type: [String],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const AiSummary: Model<IAiSummary> =
  mongoose.models.AiSummary || mongoose.model<IAiSummary>("AiSummary", AiSummarySchema);
