import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User, Wallet } from '@/lib/models';
import { sendWelcomeEmail } from '@/lib/email';

interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    dateOfBirth: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: RegisterRequest = await request.json();
        const { fullName, email, password, dateOfBirth } = body;

        // Validation
        if (!fullName || !email || !password || !dateOfBirth) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        if (fullName.trim().split(/\s+/).length < 2) {
            return NextResponse.json(
                { error: 'Please enter your full name (first and last name)' },
                { status: 400 }
            );
        }

        if (fullName.length < 2 || fullName.length > 100) {
            return NextResponse.json(
                { error: 'Name must be between 2 and 100 characters' },
                { status: 400 }
            );
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        const dob = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 18) {
            return NextResponse.json(
                { error: 'You must be at least 18 years old to register' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            dateOfBirth: dob,
        });

        // Create wallet for user
        await Wallet.create({
            userId: user._id,
            balance: 0,
            transactions: [],
        });

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, fullName).catch(console.error);

        return NextResponse.json(
            {
                message: 'Account created successfully',
                user: {
                    id: user._id.toString(),
                    fullName: user.fullName,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}
