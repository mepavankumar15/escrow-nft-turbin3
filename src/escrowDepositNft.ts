
// Seller runs: npx ts-node escrowDepositNft.ts <NFT_ASSET_PUBKEY> <ESCROW_PUBKEY>

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, fetchAsset, transfer } from "@metaplex-foundation/mpl-core";
import { signerIdentity, createSignerFromKeypair, publicKey } from "@metaplex-foundation/umi";
import fs from "fs";

async function main() {
  const [assetArg, escrowArg] = process.argv.slice(2);
  if (!assetArg || !escrowArg) {
    console.error("Usage: npx ts-node escrowDepositNft.ts <NFT_ASSET_PUBKEY> <ESCROW_PUBKEY>");
    process.exit(1);
  }

  // Use buyer/seller local wallet as signer (must be current owner of NFT)
  const umi = createUmi("https://api.devnet.solana.com").use(mplCore());

  // Load seller wallet (wallet.json must be seller's keypair)
  const secret = JSON.parse(fs.readFileSync("./wallet.json", "utf8"));
  const kp = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
  const signer = createSignerFromKeypair(umi, kp);
  umi.use(signerIdentity(signer));

  console.log("Using wallet:", signer.publicKey.toString());

  const assetPk = publicKey(assetArg);
  const escrowPk = publicKey(escrowArg);

  const asset = await fetchAsset(umi, assetPk);
  console.log("Loaded asset:", asset.publicKey.toString(), "owner:", asset.owner.toString());

  if (asset.owner.toString() !== signer.publicKey.toString()) {
    console.error("You are not the owner of the NFT. Seller must run this with their wallet.json.");
    process.exit(1);
  }

  console.log("Transferring NFT to escrow:", escrowPk.toString());

  const tx = await transfer(umi, {
    asset,
    newOwner: escrowPk,
    // include collection if required by asset (optional - mpl-core will validate)
  }).sendAndConfirm(umi);

  // encode signature for explorer
  const { base58 } = await import("@metaplex-foundation/umi/serializers");
  const sig = base58.deserialize(tx.signature);

  console.log("✅ NFT deposited to escrow. TX:", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
