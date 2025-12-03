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

function ChatRouteContent() {
  const [messages, setMessages] = useState<{ id: string; text: string; isOwn?: boolean; fromUserId?: string }[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelPage, setLeftPanelPage] = useState<
    "profile" | "settings" | "contacts" | null
  >(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const { chats, addChat, updateChatLastMessage, getChatById } = useChats();

  const handleSendMessage = (message: string) => {
    if (!socketRef.current || !selectedChatId) return;

    const selectedChat = getChatById(selectedChatId);
    // Use userId if available, otherwise fall back to chat ID for mock chats
    const recipientId = selectedChat?.userId || selectedChat?.id || selectedChatId;

    socketRef.current.emit("message", {
      to: recipientId,
      type: "text",
      encryptedContent: btoa(message),
      encryptedKey: "dummy_key",
      timestamp: new Date().toISOString(),
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: message,
        isOwn: true,
      },
    ]);

    // Update chat last message
    if (selectedChatId) {
      updateChatLastMessage(selectedChatId, `You: ${message}`);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    setMessages([]);
    setRightPanelOpen(false);
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

  const handleMessageReceived = useCallback((message: any) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Enable WebSocket notifications and messaging
  useWebSocketNotifications(handleChatCreated, handleMessageReceived);

  // Get socket reference for sending messages
  useEffect(() => {
    if (user) {
      const socket = io("http://localhost:4000/messages", {
        withCredentials: true,
      });
      socketRef.current = socket;

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [user]);

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
