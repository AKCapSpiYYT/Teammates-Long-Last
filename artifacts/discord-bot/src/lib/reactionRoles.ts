import { readFileSync, writeFileSync, existsSync } from "fs";
import { logger } from "./logger.js";

const DATA_FILE = "./reaction-roles.json";

export interface ReactionRolePair {
  emoji: string;
  roleId: string;
}

export interface ReactionRoleEntry {
  guildId: string;
  channelId: string;
  messageId: string;
  pairs: ReactionRolePair[];
}

type Store = Record<string, ReactionRoleEntry>;

function load(): Store {
  if (!existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Store;
  } catch {
    logger.error("Failed to parse reaction-roles.json, starting fresh");
    return {};
  }
}

function save(store: Store) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    logger.error("Failed to save reaction-roles.json:", err);
  }
}

export function getAll(): Store {
  return load();
}

export function getEntry(messageId: string): ReactionRoleEntry | null {
  return load()[messageId] ?? null;
}

export function addEntry(entry: ReactionRoleEntry) {
  const store = load();
  store[entry.messageId] = entry;
  save(store);
}

export function addPair(messageId: string, pair: ReactionRolePair): boolean {
  const store = load();
  const entry = store[messageId];
  if (!entry) return false;
  const exists = entry.pairs.some((p) => p.emoji === pair.emoji);
  if (exists) return false;
  entry.pairs.push(pair);
  save(store);
  return true;
}

export function removePair(messageId: string, emoji: string): boolean {
  const store = load();
  const entry = store[messageId];
  if (!entry) return false;
  const before = entry.pairs.length;
  entry.pairs = entry.pairs.filter((p) => p.emoji !== emoji);
  if (entry.pairs.length === before) return false;
  save(store);
  return true;
}

export function removeEntry(messageId: string): boolean {
  const store = load();
  if (!store[messageId]) return false;
  delete store[messageId];
  save(store);
  return true;
}
