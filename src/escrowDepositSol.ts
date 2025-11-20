// npx ts-node escrowDepositSol.ts <ESCROW_PUBLIC_KEY> <AMOUNT_SOL>

import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import fs from "fs";
import path from "path";

async function main() {
  const [escrowArg, amountArg] = process.argv.slice(2);

  if (!escrowArg || !amountArg) {
    console.error(
      "Usage: npx ts-node escrowDepositSol.ts <ESCROW_PUBLIC_KEY> <AMOUNT_SOL>"
    );
    process.exit(1);
  }

  // --- Load seller wallet ---
  const secret = JSON.parse(fs.readFileSync("./wallet.json", "utf8"));
  const seller = Keypair.fromSecretKey(new Uint8Array(secret));

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  console.log("Using seller wallet:", seller.publicKey.toString());
  const escrowPk = new PublicKey(escrowArg);

  const amountSol = parseFloat(amountArg);
  const lamports = amountSol * 1_000_000_000;

  console.log(`Depositing ${amountSol} SOL into escrow:`, escrowPk.toString());

  // --- Create transfer instruction ---
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: seller.publicKey,
      toPubkey: escrowPk,
      lamports,
    })
  );

  // --- Send transaction ---
  const signature = await sendAndConfirmTransaction(connection, tx, [seller]);

  console.log("✅ SOL deposited to escrow!");
  console.log(`Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
