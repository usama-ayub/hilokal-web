export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  coinCost: number;
  description: string;
  animation: "bounce" | "pulse" | "glow" | "sparkle" | "fireworks";
}

export const VIRTUAL_GIFTS: GiftItem[] = [
  {
    id: "coffee",
    name: "Warm Coffee",
    emoji: "☕",
    coinCost: 20,
    description: "Fuel for language learning & conversation",
    animation: "bounce",
  },
  {
    id: "rose",
    name: "Red Rose",
    emoji: "🌹",
    coinCost: 50,
    description: "Token of appreciation for great pronunciation",
    animation: "pulse",
  },
  {
    id: "trophy",
    name: "Golden Trophy",
    emoji: "🏆",
    coinCost: 100,
    description: "Award for clear explanation & fluency",
    animation: "glow",
  },
  {
    id: "crown",
    name: "VIP Crown",
    emoji: "👑",
    coinCost: 200,
    description: "Royal language mentor & dedicated speaker",
    animation: "sparkle",
  },
  {
    id: "diamond",
    name: "Sparkling Diamond",
    emoji: "💎",
    coinCost: 500,
    description: "Ultimate language exchange gratitude (Complimentary)",
    animation: "fireworks",
  },
];

export function getGiftById(giftId: string): GiftItem | undefined {
  return VIRTUAL_GIFTS.find((g) => g.id === giftId);
}
