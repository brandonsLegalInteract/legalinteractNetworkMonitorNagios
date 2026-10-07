/** Trigger a client-side file download for generated text. */
export function downloadText(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8',
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Revoke on the next tick so the download has started in every browser.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
