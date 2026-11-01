import { beforeEach, describe, expect, it, vi } from "vitest";

const { permissionMock } = vi.hoisted(() => ({
  permissionMock: vi.fn(() => "default" as NotificationPermission),
}));

vi.stubGlobal("Notification", {
  get permission() {
    return permissionMock();
  },
  requestPermission: vi.fn(async () => "granted" as NotificationPermission),
});

vi.stubGlobal("navigator", {
  serviceWorker: {
    getRegistration: vi.fn(async () => undefined),
    register: vi.fn(async () => ({})),
  },
});

Object.defineProperty(window, "isSecureContext", {
  configurable: true,
  get: () => true,
});

import {
  getDesktopNotificationState,
  markDesktopNotificationPromptSeen,
  shouldShowDesktopNotificationPrompt,
} from "../desktopNotifications";

describe("desktop notification prompt gating", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    permissionMock.mockReturnValue("default");
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      get: () => true,
    });
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(async () => undefined),
        register: vi.fn(async () => ({})),
      },
    });
  });

  it("asks once per team when permission is still undecided", () => {
    sessionStorage.setItem("username", "team1008");
    expect(shouldShowDesktopNotificationPrompt()).toBe(true);
    markDesktopNotificationPromptSeen();
    expect(shouldShowDesktopNotificationPrompt()).toBe(false);
  });

  it("does not ask again after the browser already decided", () => {
    permissionMock.mockReturnValue("granted");
    expect(shouldShowDesktopNotificationPrompt()).toBe(false);
  });

  it("does not ask on plain HTTP (insecure context)", () => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      get: () => false,
    });
    expect(shouldShowDesktopNotificationPrompt()).toBe(false);
    expect(getDesktopNotificationState()).toBe("insecure");
  });

  it("still supports notifications when service worker is missing", () => {
    vi.stubGlobal("navigator", {});
    expect(getDesktopNotificationState()).toBe("default");
    expect(shouldShowDesktopNotificationPrompt()).toBe(true);
  });
});
