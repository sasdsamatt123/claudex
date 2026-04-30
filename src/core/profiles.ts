import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getPaths, profileDir } from "./paths.js";

const ProfileSchema = z.object({
  name: z.string(),
  providerId: z.string(),
  baseUrl: z.string().url().nullable(),
  mainModel: z.string().nullable(),
  smallModel: z.string().nullable(),
  share: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const StoreSchema = z.object({
  schemaVersion: z.literal(1),
  profiles: z.array(ProfileSchema),
});

export type Profile = z.infer<typeof ProfileSchema>;

const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/;

export function isValidName(name: string): boolean {
  return NAME_RE.test(name);
}

export function loadProfiles(): Profile[] {
  const { profilesFile } = getPaths();
  if (!fs.existsSync(profilesFile)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(profilesFile, "utf8"));
    return StoreSchema.parse(raw).profiles;
  } catch (e) {
    console.warn(
      `claudex: profiles.json invalid (${(e as Error).message}), starting fresh`
    );
    return [];
  }
}

export function saveProfiles(profiles: Profile[]): void {
  const { profilesFile, home } = getPaths();
  fs.mkdirSync(home, { recursive: true });
  const store = { schemaVersion: 1 as const, profiles };
  fs.writeFileSync(profilesFile, JSON.stringify(store, null, 2) + "\n", {
    mode: 0o644,
  });
}

export function getProfile(name: string): Profile | null {
  return loadProfiles().find((p) => p.name === name) ?? null;
}

export function upsertProfile(profile: Profile): void {
  const profiles = loadProfiles();
  const i = profiles.findIndex((p) => p.name === profile.name);
  if (i >= 0) profiles[i] = profile;
  else profiles.push(profile);
  saveProfiles(profiles);
}

export function removeProfile(name: string): boolean {
  const profiles = loadProfiles();
  const next = profiles.filter((p) => p.name !== name);
  if (next.length === profiles.length) return false;
  saveProfiles(next);
  return true;
}

export function profileDataDir(name: string): string {
  return profileDir(name);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export { ProfileSchema };
