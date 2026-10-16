// UTF-8 for MQTT strings and payloads. Hand-written because Hermes does not reliably ship
// TextDecoder, and Node's Buffer is not available in React Native (CHILL-002).

export function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0) as number;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if (cp < 0x10000)
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
  }
  return Uint8Array.from(out);
}

/** Invalid sequences become U+FFFD instead of throwing. */
export function utf8Decode(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i] as number;
    let cp: number;
    let size: number;
    if (b0 < 0x80) [cp, size] = [b0, 1];
    else if (b0 >= 0xc0 && b0 < 0xe0) [cp, size] = [b0 & 0x1f, 2];
    else if (b0 >= 0xe0 && b0 < 0xf0) [cp, size] = [b0 & 0x0f, 3];
    else if (b0 >= 0xf0 && b0 < 0xf8) [cp, size] = [b0 & 0x07, 4];
    else [cp, size] = [0xfffd, 1];

    if (size > 1) {
      if (i + size > bytes.length) {
        cp = 0xfffd;
        size = bytes.length - i;
      } else {
        for (let k = 1; k < size; k++) {
          const b = bytes[i + k] as number;
          if ((b & 0xc0) !== 0x80) {
            cp = 0xfffd;
            size = k;
            break;
          }
          cp = (cp << 6) | (b & 0x3f);
        }
      }
    }
    // 4-byte sequences can spell values past Unicode's end, which fromCodePoint rejects.
    out += String.fromCodePoint(cp > 0x10ffff ? 0xfffd : cp);
    i += size;
  }
  return out;
}
