import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: { id: string; text: string; isOwn?: boolean; fromUserId?: string }[];
  selectedChat?: any;
}

export function MessageList({ messages, selectedChat }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="Transition MessageList custom-scroll with-default-bg flex-1 p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">
              No messages yet
            </div>
            <div className="text-sm">Start the conversation!</div>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 p-3 rounded-lg max-w-xs ${
              msg.isOwn 
                ? "bg-primary text-primary-foreground ml-auto" 
                : "bg-muted"
            }`}
          >
            {!msg.isOwn && (
              <div className="text-xs text-muted-foreground mb-1">
                {selectedChat?.name || "Unknown"}
              </div>
            )}
            <div>{msg.text}</div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}