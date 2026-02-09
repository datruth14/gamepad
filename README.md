# BLM - Blessings Locate Me v1

A real-time multiplayer spin-to-win game built with Next.js 14+, MongoDB, Socket.io, and Tailwind CSS.

## Features

- 🔐 **Authentication**: Registration, login, password reset with Nodemailer
- 💰 **Wallet System**: BLM coins with Paystack deposits and withdrawals
- 🎮 **6 Game Tiers**: 1K, 2K, 4K, 10K, 20K, 40K BLM entry fees
- ⚡ **Real-time**: Socket.io for live game synchronization
- 🎡 **Spinning Wheel**: Canvas-based wheel with 5 participants
- 🏆 **80/20 Split**: Winners receive 80% of the pool

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB with Mongoose
- **Auth**: NextAuth.js with bcryptjs
- **Real-time**: Socket.io
- **Payments**: Paystack
- **Email**: Nodemailer
- **Styling**: Tailwind CSS

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local .env.local.bak
```

Update the following:
- `MONGODB_URI`: Your MongoDB connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `PAYSTACK_SECRET_KEY`: Your Paystack secret key
- `PAYSTACK_PUBLIC_KEY`: Your Paystack public key
- `SMTP_*`: Your email service credentials

### 3. Run Development Server

```bash
npm run dev
```

### 4. Run Socket.io Server (separate terminal)

```bash
npx ts-node server/socket.ts
```

Or compile and run:
```bash
npm run socket
```

## Game Flow

1. **Join**: User selects a tier and joins the lobby
2. **Wait**: System waits for 5 participants
3. **Countdown**: 30-second countdown begins
4. **Spin**: Server randomly selects winner
5. **Payout**: Winner receives 80% of pool

## Currency Conversion

- **1,000 BLM = ₦500**
- **Withdrawal Fee**: 5%

## API Routes

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Wallet
- `GET /api/wallet` - Get balance & transactions
- `POST /api/wallet/deposit` - Initialize deposit
- `GET /api/wallet/verify` - Verify payment
- `POST /api/wallet/withdraw` - Request withdrawal
- `GET /api/wallet/banks` - List Nigerian banks

### Game
- `GET /api/game/lobbies` - Get all tier statuses
- `POST /api/game/join` - Join a game
- `GET /api/game/[gameId]` - Get game state
- `POST /api/game/spin` - Trigger spin (internal)

## License

© 2026 Gamepad Ltd. All rights reserved.
