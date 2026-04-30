import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sandbox, type SandboxEnv } from "./helpers.js";
import {
  isValidName,
  loadProfiles,
  upsertProfile,
  getProfile,
  removeProfile,
  nowIso,
  type Profile,
} from "../src/core/profiles.js";

const fixture = (name: string): Profile => ({
  name,
  providerId: "zai",
  baseUrl: "https://api.z.ai/api/anthropic",
  mainModel: "glm-4.7-flash",
  smallModel: "glm-4.5-flash",
  share: true,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

describe("profiles store", () => {
  let env: SandboxEnv;
  beforeEach(() => {
    env = sandbox();
  });
  afterEach(() => env.cleanup());

  it("isValidName accepts good names and rejects bad", () => {
    expect(isValidName("claude5")).toBe(true);
    expect(isValidName("zai-fast")).toBe(true);
    expect(isValidName("My_Profile")).toBe(true);
    expect(isValidName("5claude")).toBe(false);
    expect(isValidName("has space")).toBe(false);
    expect(isValidName("$dangerous")).toBe(false);
    expect(isValidName("")).toBe(false);
  });

  it("upsert + get + remove round-trip", () => {
    expect(loadProfiles()).toEqual([]);
    upsertProfile(fixture("claude5"));
    expect(loadProfiles().length).toBe(1);
    expect(getProfile("claude5")?.providerId).toBe("zai");

    upsertProfile({ ...fixture("claude5"), mainModel: "glm-5.1" });
    expect(loadProfiles().length).toBe(1);
    expect(getProfile("claude5")?.mainModel).toBe("glm-5.1");

    expect(removeProfile("claude5")).toBe(true);
    expect(loadProfiles()).toEqual([]);
    expect(removeProfile("claude5")).toBe(false);
  });

  it("supports multiple profiles", () => {
    upsertProfile(fixture("claude5"));
    upsertProfile(fixture("claude6"));
    expect(loadProfiles().map((p) => p.name).sort()).toEqual(["claude5", "claude6"]);
  });
});
