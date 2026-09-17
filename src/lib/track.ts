/**
 * A Plausible custom event. Queued by the shim in the layout if the script has
 * not loaded yet, and a no-op entirely when Plausible is not configured.
 */
export function track(event: string, props?: Record<string, string | number>) {
  try {
    (
      window as unknown as {
        plausible?: (e: string, o?: { props?: Record<string, string | number> }) => void;
      }
    ).plausible?.(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break a bid.
  }
}
