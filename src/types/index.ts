export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    icon?: any;
    color?: string; // Optional presentation properties
    textColor?: string;
    iconId?: string;
}

export interface Budget {
    id: string;
    ownerId: string;
    name: string;
    currency: string;
    members: string[];
    allowedUsers?: string[];
    isShared?: boolean;
}

export interface Transaction {
    id: string;
    amount: number;
    categoryId: string;
    date: Date;
    description: string;
    type: 'income' | 'expense';
    userId: string;
    currency: string;
    originalAmount?: number;
    originalCurrency?: string;
    isTransfer?: boolean;
    toAccountId?: string;
}

export interface Asset {
    id: string;
    name: string;
    value: number;
    currency: string;
    type: string;
}

export interface Loan {
    id: string;
    name: string;
    amount: number;
    currency: string;
    type: 'debt' | 'credit';
    interestRate?: number;
    paidAmount: number;
}
