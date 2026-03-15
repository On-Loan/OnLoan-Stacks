/**
 * Protocol Setup Script — seeds oracle prices and authorizes contracts.
 *
 * Run from frontend dir: cd frontend && node ../scripts/setup-protocol.mjs
 */

import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import {
  makeContractCall,
  broadcastTransaction,
  Cl,
  AnchorMode,
  privateKeyToHex,
} from "@stacks/transactions";

const DEPLOYER = "ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV";
const MNEMONIC =
  "ability cash guess rigid vacant mobile assault evidence stadium naive lobster ceiling march where young economy mixture world multiply portion open electric topple design";
const API = "https://api.testnet.hiro.so";

// Derive private key: m/44'/5757'/0'/0/0
const seed = mnemonicToSeedSync(MNEMONIC);
const root = HDKey.fromMasterSeed(seed);
const child = root.derive("m/44'/5757'/0'/0/0");
const senderKey = Buffer.from(child.privateKey).toString("hex") + "01"; // compressed

console.log("Deployer key derived, verifying address...");

// Fetch live prices from Pyth
const PYTH = "https://hermes.pyth.network/v2/updates/price/latest";
const STX_FEED = "0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17";
const BTC_FEED = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

async function fetchPrice(feedId) {
  const res = await fetch(`${PYTH}?ids[]=${feedId}`);
  const json = await res.json();
  const p = json.parsed[0].price;
  const price8d = Math.round(Number(p.price) * Math.pow(10, 8 + p.expo));
  const conf = Math.max(Math.round(Math.abs(Number(p.conf ?? 1000))), 100);
  const ts = Number(p.publish_time ?? Math.floor(Date.now() / 1000));
  return { price: price8d, conf, ts };
}

async function getNonce() {
  // Use child_process to call curl since Node fetch sometimes times out
  const { execSync } = await import("child_process");
  const raw = execSync(
    `curl -sf --connect-timeout 10 "${API}/v2/accounts/${DEPLOYER}?proof=0"`,
    { encoding: "utf8" }
  );
  const json = JSON.parse(raw);
  return BigInt(json.nonce);
}

async function send(label, opts, nonce) {
  console.log(`\n${label}`);
  try {
    const tx = await makeContractCall({
      ...opts,
      senderKey,
      network: "testnet",
      anchorMode: AnchorMode.Any,
      nonce,
      fee: 50000n,
    });
    // Write serialized tx to temp file, broadcast via curl
    const { execSync } = await import("child_process");
    const fs = await import("fs");
    const os = await import("os");
    const path = await import("path");
    const tmpFile = path.join(os.tmpdir(), `tx-${nonce}.bin`);
    const serialized = tx.serialize();
    // serialize() returns hex string in newer @stacks/transactions
    const buf = typeof serialized === "string"
      ? Buffer.from(serialized, "hex")
      : Buffer.from(serialized);
    fs.writeFileSync(tmpFile, buf);
    const raw = execSync(
      `curl -sf --connect-timeout 30 -X POST "${API}/v2/transactions" -H "Content-Type: application/octet-stream" --data-binary @${tmpFile}`,
      { encoding: "utf8" }
    ).trim();
    fs.unlinkSync(tmpFile);
    // Response is either a quoted txid string or JSON error
    if (raw.startsWith("{")) {
      const err = JSON.parse(raw);
      console.log(`  SKIP (${err.reason || err.error})`);
      return false;
    }
    console.log(`  OK  txid: ${raw.replace(/"/g, "")}`);
    return true;
  } catch (e) {
    console.log(`  ERR: ${e.message?.slice(0, 300)}`);
    return false;
  }
}

async function main() {
  console.log("=== OnLoan Protocol Setup ===\n");

  const [stxP, btcP] = await Promise.all([fetchPrice(STX_FEED), fetchPrice(BTC_FEED)]);
  console.log(`STX  $${(stxP.price / 1e8).toFixed(4)}`);
  console.log(`BTC  $${(btcP.price / 1e8).toFixed(2)}`);

  let nonce = await getNonce();
  console.log(`Nonce: ${nonce}`);

  const txs = [
    ["1. Authorize collateral-manager-v2", {
      contractAddress: DEPLOYER, contractName: "onloan-core-v2",
      functionName: "set-authorized-caller",
      functionArgs: [Cl.contractPrincipal(DEPLOYER, "collateral-manager-v2"), Cl.bool(true)],
    }],
    ["2. Authorize liquidation-engine-v2", {
      contractAddress: DEPLOYER, contractName: "onloan-core-v2",
      functionName: "set-authorized-caller",
      functionArgs: [Cl.contractPrincipal(DEPLOYER, "liquidation-engine-v2"), Cl.bool(true)],
    }],
    ["3. Set STX price", {
      contractAddress: DEPLOYER, contractName: "pyth-oracle-adapter-v2",
      functionName: "update-price",
      functionArgs: [Cl.stringAscii("stx"), Cl.uint(stxP.price), Cl.uint(stxP.conf), Cl.uint(stxP.ts)],
    }],
    ["4. Set sBTC price", {
      contractAddress: DEPLOYER, contractName: "pyth-oracle-adapter-v2",
      functionName: "update-price",
      functionArgs: [Cl.stringAscii("sbtc"), Cl.uint(btcP.price), Cl.uint(btcP.conf), Cl.uint(btcP.ts)],
    }],
    ["5. Set USDCx price ($1)", {
      contractAddress: DEPLOYER, contractName: "pyth-oracle-adapter-v2",
      functionName: "update-price",
      functionArgs: [Cl.stringAscii("usdcx"), Cl.uint(100000000), Cl.uint(10000), Cl.uint(Math.floor(Date.now() / 1000))],
    }],
  ];

  for (const [label, opts] of txs) {
    await send(label, opts, nonce);
    nonce++;
  }

  console.log("\nDone! Transactions should confirm in ~1-2 blocks.");
}

main().catch(console.error);
