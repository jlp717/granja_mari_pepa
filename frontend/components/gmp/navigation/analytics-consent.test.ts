type Analytics = typeof import("@/lib/analytics");
let analytics: Analytics;
const fetchMock = jest.fn();
const disconnects: jest.Mock[] = [];
beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers();
  (localStorage.getItem as jest.Mock).mockReset().mockReturnValue(null);
  (localStorage.setItem as jest.Mock).mockReset();
  (sessionStorage.getItem as jest.Mock).mockReset().mockReturnValue(null);
  (sessionStorage.setItem as jest.Mock).mockReset();
  (sessionStorage.removeItem as jest.Mock).mockReset();
  disconnects.length = 0;
  fetchMock.mockReset().mockResolvedValue({ ok: true });
  global.fetch = fetchMock;
  Object.defineProperty(global, "PerformanceObserver", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation(() => {
      const disconnect = jest.fn();
      disconnects.push(disconnect);
      return { observe: jest.fn(), disconnect };
    }),
  });
  analytics = jest.requireActual<Analytics>("@/lib/analytics");
});
afterEach(() => {
  analytics.stopAnalytics();
  jest.useRealTimers();
});
it("does not initialize optional identifiers, observers, timers or requests before consent", () => {
  analytics.initAnalytics();
  analytics.initWebVitals();
  analytics.initEngagementTracking();
  analytics.trackAuth("login_attempt");
  analytics.trackNavigation("/es");
  jest.advanceTimersByTime(60000);
  expect(jest.getTimerCount()).toBe(0);
  expect(PerformanceObserver).not.toHaveBeenCalled();
  expect(sessionStorage.setItem).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([
  null,
  "{}",
  '{"version":2,"analytics":true,"updatedAt":"2026-11-11"}',
  '{"version":1,"analytics":"true","updatedAt":"2026-11-11"}',
])("denies malformed or absent saved consent: %s", (raw) => {
  (localStorage.getItem as jest.Mock).mockReturnValue(raw);
  expect(analytics.hasAnalyticsConsent()).toBe(false);
  analytics.initAnalytics();
  expect(jest.getTimerCount()).toBe(0);
});
it("preserves the existing event endpoint and payload only after an explicit choice", async () => {
  expect(analytics.setAnalyticsConsent(true).stored).toBe(true);
  analytics.initAnalytics();
  for (let i = 0; i < 9; i++)
    analytics.trackEvent({ category: "interaction", action: "test", value: i });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  const events = JSON.parse(options.body).events;
  expect(url).toBe("/api/analytics/events");
  expect(options.method).toBe("POST");
  expect(options.credentials).toBe("include");
  expect(events).toHaveLength(10);
  expect(events[0]).toMatchObject({
    category: "navigation",
    action: "page_view",
  });
  expect(events[1]).toMatchObject({
    category: "interaction",
    action: "test",
    value: 0,
  });
  expect(events[0].sessionId).toMatch(/^session_/);
  await Promise.resolve();
});
it("revocation aborts an in-flight optional batch and removes only the optional identifier", () => {
  fetchMock.mockImplementation(() => new Promise(() => {}));
  analytics.setAnalyticsConsent(true);
  analytics.initAnalytics();
  for (let i = 0; i < 9; i++)
    analytics.trackEvent({ category: "interaction", action: "test" });
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
  expect(signal.aborted).toBe(false);
  analytics.setAnalyticsConsent(false);
  expect(signal.aborted).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
  expect(disconnects).toHaveLength(3);
  disconnects.forEach((disconnect) =>
    expect(disconnect).toHaveBeenCalledTimes(1),
  );
  expect(sessionStorage.removeItem).toHaveBeenCalledWith(
    "analytics_session_id",
  );
  expect(localStorage.removeItem).not.toHaveBeenCalledWith("auth-storage");
  analytics.trackEvent({ category: "interaction", action: "after-revocation" });
  jest.advanceTimersByTime(60000);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("withdrawal in another tab stops collection before notifying consumers", () => {
  analytics.setAnalyticsConsent(true);
  analytics.initAnalytics();
  const listener = jest.fn();
  const unsubscribe = analytics.subscribeAnalyticsConsent(listener);
  (localStorage.getItem as jest.Mock).mockReturnValue(null);
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: analytics.ANALYTICS_CONSENT_KEY,
      newValue: null,
    }),
  );
  expect(analytics.hasAnalyticsConsent()).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
  expect(listener).toHaveBeenLastCalledWith(null);
  unsubscribe();
});
it("reports failed persistence while retaining the explicit choice only in this tab", () => {
  (localStorage.setItem as jest.Mock).mockImplementation(() => {
    throw new Error("storage unavailable");
  });
  const result = analytics.setAnalyticsConsent(false);
  expect(result.stored).toBe(false);
  expect(result.choice.analytics).toBe(false);
  expect(analytics.hasAnalyticsConsent()).toBe(false);
});
