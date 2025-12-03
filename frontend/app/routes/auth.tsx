import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function AuthRoute() {
  const [loading, setLoading] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) {
      window.location.href = '/';
    }
    
    // Check if user has stored key
    const storedKey = localStorage.getItem('stalker_private_key');
    setHasStoredKey(!!storedKey);
  }, [user]);


  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        { name: "Ed25519" },
        true,
        ["sign", "verify"]
      );
      
      const publicKey = await window.crypto.subtle.exportKey(
        "raw",
        keyPair.publicKey
      );
      const privateKey = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );
      
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));
      const deviceId = "web-browser-" + Date.now();

      await login(publicKeyBase64, deviceId);
      
      // Store private key for future logins
      localStorage.setItem('stalker_private_key', privateKeyBase64);
      localStorage.setItem('stalker_public_key', publicKeyBase64);
      
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(`Failed to create account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const storedPublicKey = localStorage.getItem('stalker_public_key');
      if (!storedPublicKey) {
        toast.error("No stored key found");
        return;
      }
      
      const deviceId = "web-browser-" + Date.now();
      await login(storedPublicKey, deviceId);
      
    } catch (error) {
      console.error("Login error:", error);
      toast.error(`Failed to login: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('stalker_private_key');
    localStorage.removeItem('stalker_public_key');
    setHasStoredKey(false);
    toast.success("Stored key cleared");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-foreground text-center">
          StalkerChat
        </h1>
        <p className="text-muted-foreground text-center">
          Anonymous E2EE Messenger
        </p>
        {hasStoredKey ? (
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center">
              <button
                onClick={handleClearKey}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Use different account
              </button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>
        )}
      </div>
    </div>
  );
}
