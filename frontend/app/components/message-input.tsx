import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="middle-column-footer border-t border-border p-4">
      <div className="flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-muted rounded-l-lg outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button
          onClick={handleSend}
          className="px-4 rounded-l-none"
          disabled={!input.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}