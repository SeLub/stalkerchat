import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Video, Info } from "lucide-react";

interface MiddleHeaderProps {
  selectedChat: any;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export function MiddleHeader({ selectedChat, rightPanelOpen, onToggleRightPanel }: MiddleHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="MiddleHeader border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(selectedChat.name)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="font-medium">{selectedChat.name}</div>
            <div className="text-sm text-muted-foreground">
              {selectedChat.isOnline ? "Online" : "Last seen recently"}
            </div>
          </div>
        </div>

        {/* Chat Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleRightPanel}
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}