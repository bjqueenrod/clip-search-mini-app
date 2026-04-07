import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  closeMock: vi.fn(),
  openLinkMock: vi.fn(),
  openTelegramLinkMock: vi.fn(),
  retrieveLaunchParamsMock: vi.fn(),
  sendDataMock: vi.fn(),
}));

vi.mock('@tma.js/sdk', () => ({
  miniApp: { close: sdk.closeMock },
  openLink: sdk.openLinkMock,
  openTelegramLink: sdk.openTelegramLinkMock,
  retrieveLaunchParams: sdk.retrieveLaunchParamsMock,
}));

import { sendBotWebAppData } from './telegram';

describe('sendBotWebAppData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sdk.closeMock.mockClear();
    sdk.openLinkMock.mockClear();
    sdk.openTelegramLinkMock.mockClear();
    sdk.retrieveLaunchParamsMock.mockClear();
    sdk.sendDataMock.mockClear();
    vi.stubGlobal('window', {
      Telegram: {
        WebApp: {
          sendData: sdk.sendDataMock,
          close: vi.fn(),
        },
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends web app data and closes the mini app', () => {
    const result = sendBotWebAppData('stream_BJQ0001');

    expect(result).toBe(true);
    expect(sdk.sendDataMock).toHaveBeenCalledWith('stream_BJQ0001');
    vi.runAllTimers();
    expect(sdk.closeMock).toHaveBeenCalled();
  });
});
