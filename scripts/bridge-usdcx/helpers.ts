/**
 * Stacks address encoding helpers for xReserve bridge
 *
 * Remote recipient encoding format (32 bytes):
 *  - 11 bytes: zero padding (left)
 *  -  1 byte:  version
 *  - 20 bytes: hash160
 */
import { c32addressDecode } from "c32check";
import { type Hex, pad, toHex } from "viem";

/**
 * Encode a Stacks address into the 32-byte format required by
 * xReserve's depositToRemote `remoteRecipient` parameter.
 */
export function stacksAddressToBytes32(stacksAddress: string): Hex {
  const [version, hash160hex] = c32addressDecode(stacksAddress);

  const buf = new Uint8Array(32);
  // bytes 0-10: zero padding (already zeroed)
  buf[11] = version;
  // bytes 12-31: hash160
  const hashBytes = hexToBytes(hash160hex);
  buf.set(hashBytes, 12);

  return toHex(pad(buf, { size: 32 }));
}

/** Hex string (without 0x prefix) → Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
