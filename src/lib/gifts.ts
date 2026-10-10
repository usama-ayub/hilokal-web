import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "./db";
import { User, RoomMessage, CoinTransaction, Room } from "@/models";
import { redis } from "./redis";
import { GiftItem, VIRTUAL_GIFTS, getGiftById } from "./gifts-catalog";

export { VIRTUAL_GIFTS, getGiftById };
export type { GiftItem };

export interface SendGiftParams {
  senderId: string;
  recipientId: string;
  roomId: string;
  giftId: string;
}

export interface SendGiftResult {
  success: boolean;
  message?: string;
  error?: string;
  gift?: GiftItem;
  senderNewBalance?: number;
  recipientNewBalance?: number;
  roomMessage?: unknown;
}

/**
 * Executes double-entry coin transfer between sender and recipient for a virtual gift.
 * 100% Free Economy: Uses daily complimentary coins. Zero real payment gateways.
 */
export async function transferVirtualGift(params: SendGiftParams): Promise<SendGiftResult> {
  const { senderId, recipientId, roomId, giftId } = params;

  if (senderId === recipientId) {
    return { success: false, error: "You cannot send a gift to yourself" };
  }

  const gift = getGiftById(giftId);
  if (!gift) {
    return { success: false, error: "Invalid gift selected" };
  }

  await connectToDatabase();

  const [sender, recipient, room] = await Promise.all([
    User.findById(senderId),
    User.findById(recipientId),
    Room.findById(roomId),
  ]);

  if (!sender) {
    return { success: false, error: "Sender not found" };
  }
  if (!recipient) {
    return { success: false, error: "Recipient not found" };
  }
  if (!room) {
    return { success: false, error: "Room not found" };
  }

  // Check balance
  if (sender.coinsBalance < gift.coinCost) {
    return {
      success: false,
      error: `Insufficient coins balance. You have ${sender.coinsBalance} coins, but ${gift.name} costs ${gift.coinCost} coins. Claim your daily free login bonus for +500 coins!`,
    };
  }

  // Atomic balance updates
  sender.coinsBalance -= gift.coinCost;
  recipient.coinsBalance += gift.coinCost;

  await Promise.all([sender.save(), recipient.save()]);

  // Log sender's transaction
  await CoinTransaction.create({
    userId: sender._id,
    type: "sent_gift",
    amount: -gift.coinCost,
    balanceAfter: sender.coinsBalance,
    relatedUserId: recipient._id,
    relatedRoomId: room._id,
    description: `Sent ${gift.emoji} ${gift.name} to @${recipient.username}`,
  });

  // Log recipient's transaction
  await CoinTransaction.create({
    userId: recipient._id,
    type: "received_gift",
    amount: gift.coinCost,
    balanceAfter: recipient.coinsBalance,
    relatedUserId: sender._id,
    relatedRoomId: room._id,
    description: `Received ${gift.emoji} ${gift.name} from @${sender.username}`,
  });

  // Create In-Room Message for live chat feed
  const roomMsg = await RoomMessage.create({
    roomId: room._id,
    senderId: sender._id,
    type: "gift",
    content: `${sender.displayName || sender.username} sent ${gift.emoji} ${gift.name} to ${recipient.displayName || recipient.username}!`,
    giftDetails: {
      giftType: gift.id,
      giftName: gift.name,
      coinCost: gift.coinCost,
      recipientId: recipient._id,
    },
  });

  // Populate sender info for frontend rendering
  const populatedMsg = await RoomMessage.findById(roomMsg._id)
    .populate("senderId", "username displayName avatarUrl isVip")
    .populate("giftDetails.recipientId", "username displayName avatarUrl isVip");

  // Publish event to Redis channel for live sync
  try {
    const eventPayload = {
      type: "VIRTUAL_GIFT",
      roomId,
      gift: {
        id: gift.id,
        name: gift.name,
        emoji: gift.emoji,
        coinCost: gift.coinCost,
        animation: gift.animation,
      },
      sender: {
        id: sender._id.toString(),
        username: sender.username,
        displayName: sender.displayName,
        avatarUrl: sender.avatarUrl,
      },
      recipient: {
        id: recipient._id.toString(),
        username: recipient.username,
        displayName: recipient.displayName,
        avatarUrl: recipient.avatarUrl,
      },
      roomMessage: populatedMsg,
      timestamp: Date.now(),
    };

    await redis.publish(`room:${roomId}:events`, JSON.stringify(eventPayload));
  } catch (publishErr) {
    console.warn("Failed to publish gift event to Redis:", publishErr);
  }

  return {
    success: true,
    message: `Successfully sent ${gift.emoji} ${gift.name} to @${recipient.username}!`,
    gift,
    senderNewBalance: sender.coinsBalance,
    recipientNewBalance: recipient.coinsBalance,
    roomMessage: populatedMsg,
  };
}
