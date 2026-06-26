export async function copyText(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable.");
  }
  await navigator.clipboard.writeText(text);
}
