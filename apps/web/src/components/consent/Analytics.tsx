/**
 * Browser analytics is intentionally disabled. Third-party scripts survive
 * client navigation and can observe credential URLs through history tracking.
 * Re-enable telemetry only after it cannot expose secrets to third-party JS.
 */
export function Analytics() {
  return null;
}
