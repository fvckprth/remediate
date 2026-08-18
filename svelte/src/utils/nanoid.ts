const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function nanoid(size: number = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = "";
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}
