import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useNotifications } from './use-notifications';
import { toast } from 'sonner';

interface WebSocketNotificationsProps {
  onChatCreated?: (chatId: string) => void;
  onMessageReceived?: (message: any) => void;
}

export function useWebSocketNotifications(onChatCreated?: (chatId: string) => void, onMessageReceived?: (message: any) => void) {
  const { user } = useAuth();
  const { incrementRequests, incrementAccepted } = useNotifications();

  const stableOnChatCreated = useCallback((chatId: string) => {
    onChatCreated?.(chatId);
  }, [onChatCreated]);

  const stableOnMessageReceived = useCallback((message: any) => {
    onMessageReceived?.(message);
  }, [onMessageReceived]);

  useEffect(() => {
    if (!user) return;

    const socket: Socket = io('http://localhost:4000/messages', {
      withCredentials: true,
    });

    // Contact request received
    socket.on('contact_request_received', (data) => {
      const { fromUser, message } = data;
      const displayName = fromUser.displayName || `@${fromUser.username}` || 'Someone';
      
      toast.success(`${displayName} wants to connect`, {
        description: message || 'New contact request',
      });
      
      incrementRequests();
    });

    // Contact request accepted
    socket.on('contact_request_accepted', (data) => {
      const { byUser, chatId } = data;
      const displayName = byUser.displayName || `@${byUser.username}` || 'Someone';
      
      toast.success(`${displayName} accepted your request`, {
        description: 'You can now start chatting',
      });
      
      incrementAccepted();
      
      // Handle chat creation
      if (chatId) {
        stableOnChatCreated(chatId);
      }
    });

    // Contact request rejected
    socket.on('contact_request_rejected', (data) => {
      const { byUser } = data;
      const displayName = byUser.displayName || `@${byUser.username}` || 'Someone';
      
      toast.error(`${displayName} declined your request`);
    });

    // Message received
    socket.on('message:new', (payload: any) => {
      if (onMessageReceived) {
        onMessageReceived({
          id: Date.now().toString(),
          text: atob(payload.encryptedContent),
          fromUserId: payload.from,
          isOwn: false,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, incrementRequests, incrementAccepted, stableOnChatCreated, stableOnMessageReceived]);
}