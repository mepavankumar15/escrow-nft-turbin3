// npx ts-node escrowRelease.ts <NFT_ASSET_PUBKEY> <BUYER_PUBKEY> <SELLER_PUBKEY> <AMOUNT_SOL>

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, fetchAsset, transfer } from "@metaplex-foundation/mpl-core";
import { signerIdentity, createSignerFromKeypair, publicKey } from "@metaplex-foundation/umi";
import { Connection, Keypair, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import fs from "fs";

async function main() {
  const [assetArg, buyerArg, sellerArg, amountStr] = process.argv.slice(2);
  if (!assetArg || !buyerArg || !sellerArg || !amountStr) {
    console.error("Usage: npx ts-node escrowRelease.ts <NFT_ASSET_PUBKEY> <BUYER_PUBKEY> <SELLER_PUBKEY> <AMOUNT_SOL>");
    process.exit(1);
  }

  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) {
    console.error("Invalid amount");
    process.exit(1);
  }

  // Custodian's umi (must match the escrow wallet custodian private key in wallet.json)
  const umi = createUmi("https://api.devnet.solana.com").use(mplCore());

  // Load custodian wallet.json (escrow operator)
  const secret = JSON.parse(fs.readFileSync("./wallet.json", "utf8"));
  const kpUmi = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
  const custodianSigner = createSignerFromKeypair(umi, kpUmi);
  umi.use(signerIdentity(custodianSigner));

  // Fetch asset (should be owned by escrow custodian)
  const assetPk = publicKey(assetArg);
  const asset = await fetchAsset(umi, assetPk);

  console.log("Asset owner:", asset.owner.toString());

  // Check that custodian owns the asset
  if (asset.owner.toString() !== custodianSigner.publicKey.toString()) {
    console.error("Escrow custodian does not own the NFT — cannot release.");
    process.exit(1);
  }

  // 1) Transfer NFT to buyer
  console.log("Transferring NFT to buyer...");
  const tx1 = await transfer(umi, {
    asset,
    newOwner: publicKey(buyerArg),
  }).sendAndConfirm(umi);

  const { base58 } = await import("@metaplex-foundation/umi/serializers");
  console.log("NFT transfer TX:", `https://explorer.solana.com/tx/${base58.deserialize(tx1.signature)}?cluster=devnet`);

  // 2) Transfer SOL to seller using web3.js
  console.log("Transferring SOL to seller...");
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Convert the same custodian wallet.json to web3 Keypair
  // NOTE: wallet.json must be a 64-length secret key array for Keypair.fromSecretKey
  const secretArr = Uint8Array.from(JSON.parse(fs.readFileSync("./wallet.json", "utf8")));
  const web3Kp = Keypair.fromSecretKey(secretArr);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: web3Kp.publicKey,
      toPubkey: new PublicKey(sellerArg),
      lamports: Math.round(amount * 1e9),
    })
  );

  const sig2 = await connection.sendTransaction(tx, [web3Kp]);
  await connection.confirmTransaction(sig2, "confirmed");
  console.log("SOL transfer TX:", `https://explorer.solana.com/tx/${sig2}?cluster=devnet`);

  console.log("✅ Escrow release complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
