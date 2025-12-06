import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/db/db";
import {
  storeKeyPair,
  getPrivateKey,
  hasStoredKey,
  clearStoredKey,
} from "@/lib/db/key-management";

export default function AuthRoute() {
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const stored = await hasStoredKey();
      setHasKey(stored);
    };
    checkKey();
  }, []);

  const handleCreateAccount = async () => {
    if (typeof window === "undefined") {
      toast.error("This action is only available in browser");
      return;
    }
    setLoading(true);
    try {
      // Генерация ключей
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

      const publicKeyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(publicKey))
      );
      const privateKeyUint8 = new Uint8Array(privateKey);
      const deviceId = "web-browser-" + Date.now();

      // Сохраняем в зашифрованном виде
      await storeKeyPair(publicKeyBase64, privateKeyUint8);

      // Отправляем на сервер
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicKey: publicKeyBase64, deviceId }),
      });

      console.log("🔐 Проверка crypto.subtle:", crypto.subtle);
      console.log("🔐 Длина приватного ключа:", privateKeyUint8.length);

      if (!res.ok) throw new Error("Login failed");
      window.location.href = "/";
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(
        `Failed to create account: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const record = await db.privateKeys.get("current");
      if (!record) {
        toast.error("No stored key found");
        setLoading(false);
        return;
      }

      const deviceId = "web-browser-" + Date.now();
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicKey: record.publicKeyBase64, deviceId }),
      });

      if (!res.ok) throw new Error("Login failed");
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        `Failed to login: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = async () => {
    await clearStoredKey();
    setHasKey(false);
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
        {hasKey ? (
          <div className="space-y-3">
            <Button onClick={handleLogin} disabled={loading} className="w-full">
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
