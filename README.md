# NFT Escrow & Core NFT Management (TypeScript Project)

This project provides a complete **TypeScript-based workflow** for interacting with **Solana Core NFTs**, including:

* Batch-minting NFTs
* Transferring NFTs
* Off-chain escrow workflow (buyer/seller deposits + release/refund)

No on-chain program is required for escrow in this version. The escrow logic is performed **off-chain through coordinated scripts** using a trusted escrow wallet.

---

## Features

### Core NFT Functionality

* Create Metaplex **Core collections**
* Batch mint NFTs with metadata and images
* Transfer Core NFTs safely on Solana Devnet

### Off-Chain Escrow

Includes 4 escrow scripts:

1. `escrowDepositNft.ts`
2. `escrowDepositSol.ts`
3. `escrowRelease.ts`
4. `escrowRefund.ts`

These scripts allow:

* Seller to deposit NFT into escrow
* Buyer to deposit SOL into escrow
* Custodian to atomically release asset + payment
* Custodian to refund either party if needed

This removes "who sends first?" trust issues in P2P NFT trading.

---

## Why Escrow?

Direct NFT trades suffer from trust problems:

* Sellers fear not getting paid
* Buyers fear not receiving the NFT
* No automatic enforcement
* Payments and NFTs are irreversible

Escrow solves these issues by locking both assets until both parties fulfill their side.

---

## Project Structure

```
project/
│
├── escrowDepositNft.ts
├── escrowDepositSol.ts
├── escrowRelease.ts
├── escrowRefund.ts
│
├── assets/
│   ├── collection.png
│   └── nfts/*.png
│
├── wallet.json              # Local development wallet (seller/buyer/custodian)
├── tsconfig.json
├── package.json
└── README.md
```

---

## Requirements

* Node.js 18+
* TypeScript
* ts-node
* Solana CLI
* Devnet SOL (fund wallet.json)
* UMI SDK & Metaplex Core

---

## Installing Dependencies

Use:

```sh
npm install
```

Or manually:

```sh
npm install @metaplex-foundation/mpl-core @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/umi-uploader-irys @solana/web3.js
npm install ts-node typescript @types/node --save-dev
```

---

## tsconfig.json Example

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "esnext",
    "esModuleInterop": true,
    "strict": false,
    "skipLibCheck": true
  }
}
```

---

## Creating a TypeScript Project (Quick Guide)

```sh
mkdir my-ts-project
cd my-ts-project
npm init -y
npm install typescript ts-node @types/node --save-dev
npx tsc --init
```

Add your `.ts` files and run:

```sh
npx ts-node yourScript.ts
```

---

## Usage


### Escrow Workflow

#### Seller deposits NFT

```sh
npx ts-node escrowDepositNft.ts <NFT_ASSET> <ESCROW_PUBKEY>
```

#### Buyer deposits SOL

```sh
npx ts-node escrowDepositSol.ts <AMOUNT_SOL> <ESCROW_PUBKEY>
```

#### Custodian releases NFT + SOL

```sh
npx ts-node escrowRelease.ts <NFT_ASSET> <BUYER_PUBKEY> <SELLER_PUBKEY> <AMOUNT_SOL>
```

#### Custodian refunds parties

```sh
npx ts-node escrowRefund.ts <NFT_ASSET> <RECIPIENT> <AMOUNT_SOL_OR_ZERO>
```

---

## Security Notes

* Never commit `wallet.json` to GitHub
* Escrow custodian must be trusted (off-chain escrow)
* Use multisig or secure server for production
* Always verify NFT ownership before transfer
* Test on Devnet first

---

## Roadmap

* Full on-chain escrow (Anchor smart contract)

---
