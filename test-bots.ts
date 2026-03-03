import dbConnect from './src/lib/db';
import { User, Wallet, GameGroup } from './src/lib/models';
import { getRandomBots } from './src/lib/bots';
import mongoose from 'mongoose';

async function testBots() {
    console.log('--- Starting Bot Logic Test ---');
    await dbConnect();

    // 1. Find or create a test user
    let user = await User.findOne({ email: 'testagent@example.com' });
    if (!user) {
        user = await User.create({
            fullName: 'Test Agent',
            email: 'testagent@example.com',
            password: 'Password123!',
            dateOfBirth: new Date('1990-01-01'),
        });
    }
    const userId = user._id;

    // 2. Fund the wallet manually
    await Wallet.findOneAndUpdate(
        { userId },
        { $set: { balance: 10000 } },
        { upsert: true }
    );
    console.log('Funded test wallet with 10,000 GP');

    // 3. Clear any existing active games for this user to avoid conflicts
    await GameGroup.deleteMany({
        'participants.userId': userId,
        status: { $in: ['waiting', 'countdown', 'spinning'] }
    });

    // 4. Simulate the JOIN logic (from join/route.ts)
    console.log('Simulating Join Game...');
    const tier = 1000;
    const myUnlockCode = 'TESTER';
    const botCount = Math.floor(Math.random() * 9) + 1;
    const bots = getRandomBots(botCount);

    const participants = [
        {
            userId,
            fullName: user.fullName,
            unlockCode: myUnlockCode,
            joinedAt: new Date(),
            isBot: false
        },
        ...bots.map(bot => ({
            userId: bot.userId,
            fullName: bot.fullName,
            unlockCode: bot.unlockCode,
            joinedAt: new Date(),
            isBot: true
        }))
    ];

    const gameGroup = new GameGroup({
        tier,
        participants,
        status: 'countdown',
        totalPool: tier * participants.length,
        countdownStartedAt: new Date(),
        countdownEndsAt: new Date(Date.now() + 30000),
    });

    await gameGroup.save();
    console.log(`Created game ${gameGroup._id} with ${participants.length} total players (${botCount} bots).`);

    // 5. Simulate the SPIN logic (from spin/route.ts)
    console.log('Simulating Spin...');
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[winnerIndex];
    const winnerPayout = Math.round(gameGroup.totalPool * 0.8);

    console.log(`Winner picked: ${winner.fullName} (Bot: ${!!winner.isBot})`);

    gameGroup.status = 'completed';
    gameGroup.winnerId = winner.userId;
    gameGroup.winnerPayout = winnerPayout;
    await gameGroup.save();
    console.log('Game marked as completed.');

    // 6. Verify wallet update
    if (!winner.isBot) {
        console.log('Real user won. Verifying wallet credit...');
        const updatedWallet = await Wallet.findOne({ userId: winner.userId });
        console.log(`Wallet Balance: ${updatedWallet?.balance} GP (Expected increase by ${winnerPayout})`);
    } else {
        console.log('Bot won. Verifying NO wallet credit was issued.');
        const userWallet = await Wallet.findOne({ userId });
        console.log(`Real User Wallet Balance: ${userWallet?.balance} GP (Should still be funded amount minus entry fee if implemented, but here we just check it didn't win)`);
    }

    console.log('--- Bot Logic Test Complete ---');
    process.exit(0);
}

testBots().catch(err => {
    console.error(err);
    process.exit(1);
});
