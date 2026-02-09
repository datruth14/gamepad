import mongoose, { Schema, Document, Model } from 'mongoose';

export type GameGroupStatus = 'waiting' | 'countdown' | 'spinning' | 'completed';
export type GameGroupTier = 1000 | 2000 | 4000 | 10000 | 20000 | 40000;

export interface IParticipant {
    userId: mongoose.Types.ObjectId;
    fullName: string;
    unlockCode: string;
    joinedAt: Date;
}

export interface IGameGroup extends Document {
    _id: mongoose.Types.ObjectId;
    tier: GameGroupTier;
    participants: IParticipant[];
    status: GameGroupStatus;
    countdownStartedAt?: Date;
    countdownEndsAt?: Date;
    winnerId?: mongoose.Types.ObjectId;
    winnerUnlockCode?: string;
    totalPool: number;
    winnerPayout: number;
    systemFee: number;
    spinResult?: number; // The random spin result (0-360)
    createdAt: Date;
    updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        unlockCode: {
            type: String,
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const GameGroupSchema: Schema<IGameGroup> = new Schema(
    {
        tier: {
            type: Number,
            enum: [1000, 2000, 4000, 10000, 20000, 40000],
            required: true,
        },
        participants: {
            type: [ParticipantSchema],
            default: [],
            validate: {
                validator: function (v: IParticipant[]) {
                    return v.length <= 10;
                },
                message: 'A game group cannot have more than 10 participants',
            },
        },
        status: {
            type: String,
            enum: ['waiting', 'countdown', 'spinning', 'completed'],
            default: 'waiting',
        },
        countdownStartedAt: {
            type: Date,
        },
        countdownEndsAt: {
            type: Date,
        },
        winnerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        winnerUnlockCode: {
            type: String,
        },
        totalPool: {
            type: Number,
            default: 0,
        },
        winnerPayout: {
            type: Number,
            default: 0,
        },
        systemFee: {
            type: Number,
            default: 0,
        },
        spinResult: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
GameGroupSchema.index({ tier: 1, status: 1 });
GameGroupSchema.index({ createdAt: -1 });
GameGroupSchema.index({ 'participants.userId': 1 });

// Virtual for checking if group is full
GameGroupSchema.virtual('isFull').get(function () {
    return this.participants.length >= 10;
});

// Virtual for checking if group is locked
GameGroupSchema.virtual('isLocked').get(function () {
    return this.status === 'spinning' || this.status === 'completed';
});

const GameGroup: Model<IGameGroup> =
    mongoose.models.GameGroup || mongoose.model<IGameGroup>('GameGroup', GameGroupSchema);

export default GameGroup;
