import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'deposit' | 'withdrawal' | 'game_entry' | 'game_win' | 'game_refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface ITransaction {
    type: TransactionType;
    amount: number;
    fee?: number;
    netAmount?: number;
    reference: string;
    description?: string;
    status: TransactionStatus;
    createdAt: Date;
}

export interface IWallet extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    balance: number;
    transactions: ITransaction[];
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        type: {
            type: String,
            enum: ['deposit', 'withdrawal', 'game_entry', 'game_win', 'game_refund'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount cannot be negative'],
        },
        fee: {
            type: Number,
            default: 0,
        },
        netAmount: {
            type: Number,
        },
        reference: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const WalletSchema: Schema<IWallet> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: [0, 'Balance cannot be negative'],
        },
        transactions: {
            type: [TransactionSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
WalletSchema.index({ userId: 1 });
WalletSchema.index({ 'transactions.reference': 1 });
WalletSchema.index({ 'transactions.createdAt': -1 });

const Wallet: Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);

export default Wallet;
