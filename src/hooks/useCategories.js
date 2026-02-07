import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import {
    Utensils,
    Pizza,
    Coffee,
    ShoppingBag,
    ShoppingCart,
    Home,
    Car,
    Heart,
    Smartphone,
    Plane,
    Wallet,
    Briefcase,
    PiggyBank,
    Star,
    Gift,
    Music,
    Clapperboard,
    BookOpen,
    Zap,
    Wifi,
    HelpCircle,
    TrendingUp,
    Bitcoin,
    Banknote,
    Landmark,
    PieChart,
    DollarSign,
} from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { DEFAULT_CATEGORIES } from '../constants';
import { db, appId } from '../firebase';
import { categoriesService } from '../services/categories.service';
import { fetchExchangeRate } from '../utils/currency';

const ICON_MAP = {
    utensils: Utensils,
    pizza: Pizza,
    coffee: Coffee,
    home: Home,
    car: Car,
    heart: Heart,
    health: Heart,
    shopping: ShoppingBag,
    cart: ShoppingCart,
    zap: Zap,
    wifi: Wifi,
    smartphone: Smartphone,
    plane: Plane,
    wallet: Wallet,
    briefcase: Briefcase,
    piggy: PiggyBank,
    star: Star,
    gift: Gift,
    music: Music,
    film: Clapperboard,
    book: BookOpen,
    bitcoin: Bitcoin,
    cash: Banknote,
    bank: Landmark,
    stock: TrendingUp,
    pie: PieChart,
    dollar: DollarSign,
    other: HelpCircle,
    food: Utensils,
    cafe: Coffee,
    transport: Car,
    housing: Home,
    tech: Smartphone,
    communication: Wifi,
    travel: Plane,
    education: BookOpen,
    gifts: Gift,
    services: Zap,
    investments: TrendingUp,
    entertainment: Clapperboard,
    salary: Briefcase,
    freelance: Briefcase,
    savings: PiggyBank,
};

const STORAGE_CURRENCY = 'EUR';

/**
 * useCategories Hook
 *
 * @param {string} activeBudgetId - Current budget ID
 * @param {object} rawData - { categories, limits }
 *   - categories: Array of category objects from Firestore
 *   - limits: Object map of categoryId -> limitAmount (MUST be in mainCurrency, pre-converted by parent)
 * @param {object} t - Translations
 * @param {string} mainCurrency - Display currency (e.g. 'USD', 'EUR')
 *
 * @returns {object} { allCategories, categoryLimits, addCategory, deleteCategory, saveLimit }
 *   - categoryLimits: Same as input limits (display-ready)
 *   - saveLimit: Converts back to STORAGE_CURRENCY before saving to Firestore
 */
export const useCategories = (activeBudgetId, rawData, t, mainCurrency = 'EUR') => {
    const { categories: rawCategories = [], limits: rawLimits = {} } = rawData;

    const getBudgetDocRef = () =>
        doc(db, 'artifacts', appId, 'public', 'data', 'budgets', activeBudgetId);

    // Merge stored categories with defaults and map icons
    const allCategories = useMemo(() => {
        const storedCats = rawCategories;
        const mergedStored = storedCats.map((stored) => {
            const def = DEFAULT_CATEGORIES.find((d) => d.id === stored.id);
            if (def)
                return { ...stored, icon: def.icon, color: def.color, textColor: def.textColor };
            const mappedIcon = ICON_MAP[stored.iconId] || Star;
            return { ...stored, icon: mappedIcon };
        });
        const missingDefaults = DEFAULT_CATEGORIES.filter(
            (d) => !mergedStored.some((s) => s.id === d.id)
        );
        return [...mergedStored, ...missingDefaults];
    }, [rawCategories]);

    // Return limits as-is
    // IMPORTANT: Expects limits ALREADY CONVERTED to mainCurrency by parent (useBudget)
    // These are display-ready values - no additional conversion needed
    const categoryLimits = useMemo(() => {
        return rawLimits;
    }, [rawLimits]);

    const addCategory = async (catData) => {
        if (!activeBudgetId) return;
        // Clean icon from object before saving
        const { icon: _icon, ...rest } = catData;
        await updateDoc(getBudgetDocRef(), { categories: arrayUnion(rest) });
    };

    const deleteCategory = async (catId) => {
        if (!activeBudgetId) return;
        if (!confirm(t.confirm_delete || 'Delete category?')) return;
        const ref = getBudgetDocRef();
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const currentCats = snap.data().categories || [];
            const newCats = currentCats.filter((c) => c.id !== catId);
            await updateDoc(ref, { categories: newCats });
        }
    };

    const saveLimit = async (categoryId, amount) => {
        if (!activeBudgetId) return;

        let limitInStorage = parseFloat(amount);

        if (isNaN(limitInStorage) || limitInStorage < 0) {
            toast.error(t.invalid_amount || 'Invalid amount');
            return;
        }

        // Convert from display currency to storage currency
        if (mainCurrency !== STORAGE_CURRENCY) {
            try {
                const rate = await fetchExchangeRate(mainCurrency, STORAGE_CURRENCY);
                limitInStorage = limitInStorage * rate;
                console.log(
                    `Converted limit: ${amount} ${mainCurrency} -> ${limitInStorage.toFixed(2)} ${STORAGE_CURRENCY}`
                );
            } catch (e) {
                console.error('Conversion failed:', e);
                toast.error(t.conversion_error || 'Currency conversion failed');
                return;
            }
        }

        try {
            await categoriesService.saveLimit(activeBudgetId, categoryId, limitInStorage);
            toast.success(t.success_save || 'Saved');
        } catch (e) {
            console.error('Failed to save limit:', e);
            toast.error(t.error_save || 'Error saving limit');
        }
    };

    return {
        allCategories,
        categoryLimits, // Note: This might be raw if not processed by parent
        addCategory,
        deleteCategory,
        saveLimit,
    };
};
