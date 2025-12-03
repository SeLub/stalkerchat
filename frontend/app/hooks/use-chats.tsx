import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";

interface Chat {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isOnline?: boolean;
  phone?: string;
  username?: string;
  publicKey?: string;
  userId?: string;
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Mock data for now - will be replaced with real API calls
  const mockChats: Chat[] = [
    {
      id: "6d36bdb6-8651-4d72-94f4-3c9aa13f489d",
      name: "John Doe",
      lastMessage: "Hello there!",
      timestamp: "12:30",
      unreadCount: 3,
      isOnline: true,
      phone: "+1 234 567 8900",
      username: "johndoe",
      publicKey: "fxhKP0trJd8XJR3IPTVOmA+BFXpFgWtJDRLC8LOZnMI=",
    },
    {
      id: "saved-messages",
      name: "Saved Messages",
      lastMessage: "You: Test message",
      timestamp: "11:45",
      isOnline: false,
    },
  ];

  useEffect(() => {
    if (user) {
      loadChatsFromBackend();
    }
  }, [user]);

  const loadChatsFromBackend = async () => {
    try {
      const res = await fetch('http://localhost:4000/contacts', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        const chats = data.contacts.map((contact: any) => ({
          id: `chat_${contact.user.id}`,
          name: contact.user.displayName || `@${contact.user.username}` || "Unknown User",
          userId: contact.user.id,
          publicKey: contact.user.publicKey,
          isOnline: false,
        }));
        setChats([...mockChats, ...chats]);
      } else {
        setChats(mockChats);
      }
    } catch (error) {
      setChats(mockChats);
    } finally {
      setLoading(false);
    }
  };

  const addChat = (newChat: Partial<Chat>) => {
    const chat: Chat = {
      id: newChat.id || newChat.publicKey || Date.now().toString(),
      name: newChat.name || newChat.username || "Unknown User",
      lastMessage: undefined,
      timestamp: undefined,
      unreadCount: 0,
      isOnline: false,
      ...newChat,
    };

    setChats((prev) => {
      // Check if chat already exists
      const exists = prev.find(
        (c) => c.id === chat.id || c.publicKey === chat.publicKey
      );
      if (exists) return prev;

      return [chat, ...prev];
    });

    return chat.id;
  };

  const updateChatLastMessage = (chatId: string, message: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              lastMessage: message,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : chat
      )
    );
  };

  const getChatById = (chatId: string) => {
    return chats.find((chat) => chat.id === chatId);
  };

  return {
    chats,
    loading,
    addChat,
    updateChatLastMessage,
    getChatById,
  };
}
