import { useState } from "react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UsernameSetupModal } from "@/components/username-setup-modal";
import { PrivacySettingsModal } from "@/components/privacy-settings-modal";
import { ContactsPage } from "@/components/contacts-page";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Edit3, 
  Camera, 
  User, 
  Phone, 
  AtSign,
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  LogOut
} from "lucide-react";

interface LeftPanelPageProps {
  page: 'profile' | 'settings' | 'contacts' | null;
  onBack: () => void;
  userProfile?: {
    displayName?: string;
    publicKey: string;
    phone?: string;
    username?: string;
  };
  onChatCreated?: (chatId: string) => void;
}

export function LeftPanelPages({ page, onBack, userProfile, onChatCreated }: LeftPanelPageProps) {
  const { logout } = useAuth();
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  
  if (!page) return null;

  const getInitials = (name?: string) => {
    if (!name) return userProfile?.publicKey.slice(0, 2).toUpperCase() || "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth';
  };

  if (page === 'profile') {
    return (
      <>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">My Profile</h2>
          </div>

          {/* Profile Photo Section */}
          <div className="p-6 text-center border-b border-border">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(userProfile?.displayName)}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <ProfileField
                icon={<User className="h-5 w-5" />}
                label="Display Name"
                value={userProfile?.displayName || "Not set"}
                onEdit={() => {}}
              />
              
              <ProfileField
                icon={<AtSign className="h-5 w-5" />}
                label="Username"
                value={userProfile?.username ? `@${userProfile.username}` : "Not set"}
                onEdit={() => setUsernameModalOpen(true)}
              />
              
              <ProfileField
                icon={<Phone className="h-5 w-5" />}
                label="Phone"
                value={userProfile?.phone || "Not set"}
                onEdit={() => {}}
              />

              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">Public Key</div>
                <div className="text-xs font-mono bg-muted p-3 rounded-lg break-all">
                  {userProfile?.publicKey}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Username Modal */}
        <UsernameSetupModal
          isOpen={usernameModalOpen}
          onClose={() => setUsernameModalOpen(false)}
          currentUsername={userProfile?.username}
        />
      </>
    );
  }

  if (page === 'contacts') {
    return (
      <ContactsPage
        onBack={onBack}
        onChatSelect={(userId) => {
          onChatCreated?.(userId);
          onBack();
        }}
        onChatCreated={(chatId) => {
          onChatCreated?.(chatId);
          onBack();
        }}
      />
    );
  }

  if (page === 'settings') {
    return (
      <>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>

          {/* Settings List */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              <SettingsSection title="Notifications">
                <SettingsItem
                  icon={<Bell className="h-5 w-5" />}
                  label="Message Notifications"
                  hasSwitch
                  defaultChecked
                />
                <SettingsItem
                  icon={<Bell className="h-5 w-5" />}
                  label="Sound"
                  hasSwitch
                  defaultChecked
                />
              </SettingsSection>

              <SettingsSection title="Privacy & Security">
                <SettingsItem
                  icon={<Shield className="h-5 w-5" />}
                  label="Privacy Settings"
                  onClick={() => setPrivacyModalOpen(true)}
                />
                <SettingsItem
                  icon={<Shield className="h-5 w-5" />}
                  label="Active Sessions"
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection title="Appearance">
                <SettingsItem
                  icon={<Palette className="h-5 w-5" />}
                  label="Theme"
                  onClick={() => {}}
                />
              </SettingsSection>

              <SettingsSection title="Advanced">
                <SettingsItem
                  icon={<Globe className="h-5 w-5" />}
                  label="Language"
                  onClick={() => {}}
                />
                <SettingsItem
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Help & Support"
                  onClick={() => {}}
                />
              </SettingsSection>

              <div className="p-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Privacy Modal */}
        <PrivacySettingsModal
          isOpen={privacyModalOpen}
          onClose={() => setPrivacyModalOpen(false)}
        />
      </>
    );
  }

  return null;
}

interface ProfileFieldProps {
  icon: ReactNode;
  label: string;
  value: string;
  onEdit: () => void;
}

function ProfileField({ icon, label, value, onEdit }: ProfileFieldProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50">
      <div className="flex items-center space-x-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="font-medium">{value}</div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Edit3 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="mb-6">
      <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface SettingsItemProps {
  icon: ReactNode;
  label: string;
  hasSwitch?: boolean;
  defaultChecked?: boolean;
  onClick?: () => void;
}

function SettingsItem({ icon, label, hasSwitch, defaultChecked, onClick }: SettingsItemProps) {
  return (
    <div 
      className="flex items-center justify-between px-4 py-3 hover:bg-accent cursor-pointer"
      onClick={!hasSwitch ? onClick : undefined}
    >
      <div className="flex items-center space-x-3">
        <div className="text-muted-foreground">{icon}</div>
        <span>{label}</span>
      </div>
      {hasSwitch && (
        <Switch defaultChecked={defaultChecked} />
      )}
    </div>
  );
}