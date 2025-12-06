import Dexie from "dexie";
import { SCHEMA, type Message, type Contact, type PrivateKey } from "./schema";

class StalkerDB extends Dexie {
  messages!: Dexie.Table<Message, string>;
  contacts!: Dexie.Table<Contact, string>;
  privateKeys!: Dexie.Table<PrivateKey, string>;

  constructor() {
    super("StalkerDB");
    this.version(1).stores(SCHEMA);
  }
}

export const db = new StalkerDB();
