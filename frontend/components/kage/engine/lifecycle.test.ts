import { withAbort, cancelDriver } from "./lifecycle";
it("cancels a pending real wait immediately when its route leaves", async () => {
  const controller = new AbortController();
  const task = new Promise<void>(() => undefined);
  const promise = withAbort(task, controller.signal);
  controller.abort();
  await expect(promise).rejects.toMatchObject({ name: "AbortError" });
});
it("retains successful results and removes its listener", async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, "removeEventListener");
  await expect(
    withAbort(Promise.resolve(149), controller.signal),
  ).resolves.toBe(149);
  expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
});
it("keeps the original failure and does not turn it into readiness", async () => {
  const controller = new AbortController();
  const error = new Error("Font unavailable");
  await expect(
    withAbort(Promise.reject(error), controller.signal),
  ).rejects.toBe(error);
});

it("cancels only the scheduler that owns a handle", () => {
  const raf = jest
      .spyOn(globalThis, "cancelAnimationFrame")
      .mockImplementation(() => undefined),
    timer = jest
      .spyOn(globalThis, "clearTimeout")
      .mockImplementation(() => undefined);
  cancelDriver(149, false);
  expect(raf).toHaveBeenCalledWith(149);
  expect(timer).not.toHaveBeenCalled();
  raf.mockClear();
  cancelDriver(149, true);
  expect(timer).toHaveBeenCalledWith(149);
  expect(raf).not.toHaveBeenCalled();
  raf.mockRestore();
  timer.mockRestore();
});
