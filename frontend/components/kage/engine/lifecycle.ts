/** Stop a route-owned wait without cancelling browser font requests needed by SSR. */
export function withAbort<T>(
  task: PromiseLike<T> | T,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const abort = () => reject(new DOMException("Cancelled", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(task).then(
      (value) => {
        signal.removeEventListener("abort", abort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
}

/** RAF and timeout IDs belong to different APIs: never cancel an unrelated UI timer. */
export function cancelDriver(handle: number, timer: boolean): void {
  if (timer) clearTimeout(handle);
  else cancelAnimationFrame(handle);
}
