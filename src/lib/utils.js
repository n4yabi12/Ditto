/**
 * Format bytes into a human-readable string.
 * @param {number} bytes
 */
export function fmt(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/**
 * Format a Unix timestamp (seconds) into a readable date string.
 * @param {number} secs
 */
export function fmtDate(secs) {
  if (!secs) return "";
  return new Date(secs * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Extract the filename from a path, supporting both "/" (macOS/Linux)
 * and "\" (Windows) separators.
 * @param {string} path
 */
export function basename(path) {
  return path.split(/[\\/]/).pop() ?? path;
}

/**
 * Platform detection via WebView user-agent.
 * Used to show the correct file manager name in the UI.
 */
export const isWindows =
  typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");

export const isLinux =
  typeof navigator !== "undefined" && navigator.userAgent.includes("Linux");

/** Label for the "reveal in file manager" button. */
export const fileManagerLabel = isWindows ? "Explorer" : isLinux ? "Files" : "Finder";
