import { useState, useEffect } from 'react';
import { KeyService } from '../lib/db/services/key-service';
import { MessageService } from '../lib/db/services/message-service';

export function useLocalDb(privateKeyBase64: string) {
  const [isReady, setIsReady] = useState(false);
  const keyService = new KeyService();
  const messageService = new MessageService();

  useEffect(() => {
    const init = async () => {
      await keyService.savePrivateKey(
        new Uint8Array(Buffer.from(privateKeyBase64, 'base64')),
        privateKeyBase64
      );
      setIsReady(true);
    };
    init();
  }, [privateKeyBase64]);

  return { isReady, keyService, messageService };
}
