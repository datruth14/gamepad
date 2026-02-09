import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    password: string;
    dateOfBirth: Date;
    emailVerified: boolean;
    resetToken?: string;
    resetTokenExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        resetToken: {
            type: String,
            default: undefined,
        },
        resetTokenExpiry: {
            type: Date,
            default: undefined,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ resetToken: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
