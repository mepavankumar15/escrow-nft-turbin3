// If amount = 0, only NFT is refunded; if NFT not with custodian, it'll skip NFT step.

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, fetchAsset, transfer } from "@metaplex-foundation/mpl-core";
import { signerIdentity, createSignerFromKeypair, publicKey } from "@metaplex-foundation/umi";
import { Connection, Keypair, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import fs from "fs";

async function main() {
  const [assetArg, recipientArg, amountStr] = process.argv.slice(2);
  if (!assetArg || !recipientArg || amountStr === undefined) {
    console.error("Usage: npx ts-node escrowRefund.ts <NFT_ASSET_PUBKEY> <RECIPIENT_PUBKEY> <AMOUNT_SOL_OR_ZERO>");
    process.exit(1);
  }

  const amount = Number(amountStr);

  const umi = createUmi("https://api.devnet.solana.com").use(mplCore());
  const secret = JSON.parse(fs.readFileSync("./wallet.json", "utf8"));
  const kpUmi = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
  const custodianSigner = createSignerFromKeypair(umi, kpUmi);
  umi.use(signerIdentity(custodianSigner));

  // Try NFT refund (if escrow owns it)
  try {
    const assetPk = publicKey(assetArg);
    const asset = await fetchAsset(umi, assetPk);

    if (asset.owner.toString() === custodianSigner.publicKey.toString()) {
      console.log("Returning NFT to:", recipientArg);
      const tx = await transfer(umi, {
        asset,
        newOwner: publicKey(recipientArg),
      }).sendAndConfirm(umi);
      const { base58 } = await import("@metaplex-foundation/umi/serializers");
      console.log("NFT refund TX:", `https://explorer.solana.com/tx/${base58.deserialize(tx.signature)}?cluster=devnet`);
    } else {
      console.log("Escrow does not own the NFT; skipping NFT refund.");
    }
  } catch (err) {
    console.log("NFT refund check failed:", err.message || err);
  }

  // SOL refund
  if (!isNaN(amount) && amount > 0) {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const secretArr = Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf8")));
    const web3Kp = Keypair.fromSecretKey(secretArr);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: web3Kp.publicKey,
        toPubkey: new PublicKey(recipientArg),
        lamports: Math.round(amount * 1e9),
      })
    );

    const sig = await connection.sendTransaction(tx, [web3Kp]);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("SOL refund TX:", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  } else {
    console.log("No SOL refund requested.");
  }

  console.log("✅ Refund process finished.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
