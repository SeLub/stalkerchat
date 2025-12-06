import { db } from "./db";
import type { Message } from "./schema";

// Сохранение сообщения
export async function saveMessage(
  chatId: string,
  senderId: string,
  content: string,
  isOwn: boolean
): Promise<void> {
  const encoder = new TextEncoder();
  const encryptedContent = encoder.encode(content);

  const message: Omit<Message, "id"> = {
    chatId,
    senderId,
    contentType: "text",
    encryptedContent,
    timestamp: Date.now(),
    isOwn,
  };

  try {
    await db.messages.add(message as Message);
    
    // Проверяем лимит сообщений (1000 на чат)
    await enforceMessageLimit(chatId, 1000);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      // Очищаем половину старых сообщений
      await enforceMessageLimit(chatId, 500);
      // Повторяем попытку
      await db.messages.add(message as Message);
    } else {
      throw error;
    }
  }
}

// Ограничение количества сообщений в чате
async function enforceMessageLimit(chatId: string, limit: number): Promise<void> {
  const messages = await db.messages
    .where("chatId")
    .equals(chatId)
    .reverse()
    .sortBy("timestamp");

  if (messages.length > limit) {
    const toDelete = messages.slice(limit).map(m => m.id);
    await db.messages.bulkDelete(toDelete);
  }
}

// Загрузка сообщений для чата
export async function loadMessages(chatId: string): Promise<Array<{
  id: string;
  text: string;
  isOwn: boolean;
  fromUserId: string;
}>> {
  const messages = await db.messages
    .where("chatId")
    .equals(chatId)
    .sortBy("timestamp");

  const decoder = new TextDecoder();
  return messages.map((msg) => ({
    id: msg.id,
    text: decoder.decode(msg.encryptedContent),
    isOwn: msg.isOwn,
    fromUserId: msg.senderId,
  }));
}

// Очистка сообщений чата
export async function clearChatMessages(chatId: string): Promise<void> {
  await db.messages.where("chatId").equals(chatId).delete();
}
