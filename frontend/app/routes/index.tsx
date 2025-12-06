import { useState, useRef, useCallback, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { LeftColumn } from "@/components/left-column";
import { MiddleColumn } from "@/components/middle-column";
import { RightPanel } from "@/components/right-panel";
import { NewChatModal } from "@/components/new-chat-modal";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { useChats } from "@/hooks/use-chats";
import { useWebSocketNotifications } from "@/hooks/use-websocket-notifications";
import { saveMessage, loadMessages } from "@/lib/db/message-storage";
import { cleanupOldMessages } from "@/lib/db/cleanup";

function ChatRouteContent() {
  const [messages, setMessages] = useState<
    { id: string; text: string; isOwn?: boolean; fromUserId?: string }[]
  >([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelPage, setLeftPanelPage] = useState<
    "profile" | "settings" | "contacts" | null
  >(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const {
    chats,
    addChat,
    updateChatLastMessage,
    updateChatOnlineStatus,
    getChatById,
  } = useChats();

  const handleSendMessage = async (message: string) => {
    if (!socketRef.current || !selectedChatId || !user) return;

    const selectedChat = getChatById(selectedChatId);
    const recipientId =
      selectedChat?.userId || selectedChat?.id || selectedChatId;

    // Encode Unicode to base64
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const base64Message = btoa(String.fromCharCode(...messageBytes));

    socketRef.current.emit("message", {
      to: recipientId,
      type: "text",
      encryptedContent: base64Message,
      encryptedKey: "dummy_key",
      timestamp: new Date().toISOString(),
    });

    const newMessage = {
      id: Date.now().toString(),
      text: message,
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Save to IndexedDB
    await saveMessage(selectedChatId, user.id, message, true);

    // Update chat last message
    updateChatLastMessage(selectedChatId, `You: ${message}`);
  };

  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId);
    setRightPanelOpen(false);
    
    // Load messages from IndexedDB
    const loadedMessages = await loadMessages(chatId);
    setMessages(loadedMessages);
  };

  const handleNewChat = () => {
    setNewChatModalOpen(true);
  };

  const handleChatCreated = useCallback(
    async (chatId: string) => {
      try {
        // Load chat info from backend
        const res = await fetch(`http://localhost:4000/chats/${chatId}`, {
          credentials: "include",
        });

        if (res.ok) {
          const chatData = await res.json();
          // Find the other user in the chat
          const otherMember = chatData.members?.find(
            (m: any) => m.userId !== user?.id
          );

          const newChatId = addChat({
            id: chatId,
            name:
              otherMember?.user?.displayName ||
              `@${otherMember?.user?.username?.username}` ||
              "Unknown User",
            publicKey: otherMember?.user?.publicKey,
            userId: otherMember?.user?.id,
          });
          setSelectedChatId(newChatId);
        } else {
          // Fallback if API fails
          const newChatId = addChat({ id: chatId });
          setSelectedChatId(newChatId);
        }
      } catch (error) {
        // Fallback if API fails
        const newChatId = addChat({ id: chatId });
        setSelectedChatId(newChatId);
      }
      setNewChatModalOpen(false);
    },
    [user?.id, addChat, setSelectedChatId, setNewChatModalOpen]
  );

  const handleMessageReceived = useCallback(async (message: any) => {
    let isDuplicate = false;
    
    setMessages((prev) => {
      if (prev.some(m => m.id === message.id)) {
        isDuplicate = true;
        return prev;
      }
      return [...prev, message];
    });
    
    if (!isDuplicate && selectedChatId) {
      await saveMessage(selectedChatId, message.fromUserId, message.text, false);
    }
  }, [selectedChatId]);

  const handleUserOnline = useCallback(
    (userId: string) => {
      updateChatOnlineStatus(userId, true);
    },
    [updateChatOnlineStatus]
  );

  const handleUserOffline = useCallback(
    (userId: string) => {
      updateChatOnlineStatus(userId, false);
    },
    [updateChatOnlineStatus]
  );

  // Enable WebSocket notifications and messaging
  useWebSocketNotifications(
    handleChatCreated,
    handleMessageReceived,
    handleUserOnline,
    handleUserOffline
  );

  // Get socket reference for sending messages
  useEffect(() => {
    if (user && window.socketInstance) {
      socketRef.current = window.socketInstance;
    }
  }, [user]);

  // Cleanup old messages on app start
  useEffect(() => {
    cleanupOldMessages();
  }, []);

  const handleProfileClick = () => {
    setLeftPanelPage("profile");
  };

  const handleContactsClick = () => {
    setLeftPanelPage("contacts");
  };

  const handleSettingsClick = () => {
    setLeftPanelPage("settings");
  };

  const handleBackToChats = () => {
    setLeftPanelPage(null);
  };

  const selectedChat = getChatById(selectedChatId || "");

  return (
    <div id="Main" className="flex h-screen bg-background text-foreground">
      <LeftColumn
        leftPanelPage={leftPanelPage}
        userProfile={user}
        chats={chats}
        selectedChatId={selectedChatId}
        onProfileClick={handleProfileClick}
        onContactsClick={handleContactsClick}
        onSettingsClick={handleSettingsClick}
        onBackToChats={handleBackToChats}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onChatCreated={handleChatCreated}
      />

      <MiddleColumn
        selectedChat={selectedChat}
        messages={messages}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        onSendMessage={handleSendMessage}
      />

      {/* Right Panel */}
      <RightPanel
        isOpen={rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
        chatInfo={selectedChat}
      />

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}

export default function ChatRoute() {
  return (
    <AuthGuard>
      <ChatRouteContent />
    </AuthGuard>
  );
}
