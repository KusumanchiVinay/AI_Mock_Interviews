'use server';

import { db, auth } from "@/firebase/admin";
import { CollectionReference, DocumentReference, DocumentData } from "firebase-admin/firestore";
import { cookies } from "next/headers";

export const getUserRecord = async (decodedClaims: { uid: string }) => {
    if (!decodedClaims?.uid) return null;

    try {
        const usersCollection = db.collection('users') as CollectionReference<DocumentData>;
        const userDocRef = usersCollection.doc(decodedClaims.uid) as DocumentReference<DocumentData>;
        const userRecord = await userDocRef.get();
        return userRecord.exists ? userRecord.data() : null;
    } catch (error) {
        console.error('Error fetching user record:', error);
        return null;
    }
};

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function signUp(params: SignUpParams) {
    const { uid, name, email } = params;

    try {
        const usersCollection = db.collection('users') as CollectionReference<DocumentData>;
        const userDocRef = usersCollection.doc(uid) as DocumentReference<DocumentData>;
        const userRecord = await userDocRef.get();

        if (userRecord.exists) {
            return {
                success: false,
                message: 'User already exists. Please sign in instead.'
            };
        }

        await userDocRef.set({ name, email });

        return {
            success: true,
            message: 'Account created successfully. Please sign in.'
        };
    } catch (e: any) {
        console.error('Error creating a user', e);

        if (e.code === 'auth/email-already-exists') {
            return {
                success: false,
                message: 'This email is already in use.'
            };
        }

        return {
            success: false,
            message: 'Failed to create an account'
        };
    }
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        const userRecord = await auth.getUserByEmail(email);

        if (!userRecord) {
            return {
                success: false,
                message: 'User does not exist. Create an account instead.'
            };
        }

        await setSessionCookie(idToken);
    } catch (e) {
        console.log(e);

        return {
            success: false,
            message: 'Failed to log into an account.'
        };
    }
}

export async function setSessionCookie(idToken: string) {
    const cookieStore = cookies();

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: ONE_WEEK * 1000,
    });

    cookieStore.set('session', sessionCookie, {
        maxAge: ONE_WEEK,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax'
    });
}

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = cookies();

    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        const usersCollection = db.collection('users') as CollectionReference<DocumentData>;
        const userDocRef = usersCollection.doc(decodedClaims.uid) as DocumentReference<DocumentData>;
        const userRecord = await userDocRef.get();

        if (!userRecord.exists) return null;

        return {
            ...userRecord.data(),
            id: userRecord.id,
        } as User;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}
