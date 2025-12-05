import React, { useState } from 'react';
import { X, Coffee, Utensils, Pizza, ShoppingBag, ShoppingCart, Home, Car, Plane, Zap, Wifi, Clapperboard, Gift, Music, BookOpen, Briefcase, PiggyBank, Heart, Smartphone, Star, TrendingUp, HelpCircle } from 'lucide-react';

const CATEGORY_ICONS_SELECTION = [
    { id: 'coffee', icon: Coffee }, { id: 'utensils', icon: Utensils }, { id: 'pizza', icon: Pizza },
    { id: 'shopping', icon: ShoppingBag }, { id: 'cart', icon: ShoppingCart }, { id: 'home', icon: Home },
    { id: 'car', icon: Car }, { id: 'plane', icon: Plane }, { id: 'zap', icon: Zap }, { id: 'wifi', icon: Wifi },
    { id: 'film', icon: Clapperboard }, { id: 'gift', icon: Gift }, { id: 'music', icon: Music },
    { id: 'book', icon: BookOpen }, { id: 'briefcase', icon: Briefcase }, { id: 'piggy', icon: PiggyBank },
    { id: 'heart', icon: Heart }, { id: 'smartphone', icon: Smartphone }, { id: 'star', icon: Star },
    { id: 'invest', icon: TrendingUp }, { id: 'other', icon: HelpCircle }
];

export default function CategoryModal({ isOpen, onClose, onSave, t }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [color, setColor] = useState('bg-blue-500');
    const [icon, setIcon] = useState('star');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, type, color, icon });
        setName('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.add_category}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500">{t.cat_name}</label>
                        <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setType('expense')} className={`py-2 rounded-xl text-sm font-bold border-2 ${type === 'expense' ? 'border-red-500 bg-red-50 text-red-600' : 'border-transparent bg-slate-100 text-slate-500'}`}>{t.expense}</button>
                        <button type="button" onClick={() => setType('income')} className={`py-2 rounded-xl text-sm font-bold border-2 ${type === 'income' ? 'border-green-500 bg-green-50 text-green-600' : 'border-transparent bg-slate-100 text-slate-500'}`}>{t.income}</button>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-2 block">{t.cat_icon}</label>
                        <div className="flex gap-2 flex-wrap h-32 overflow-y-auto">
                            {CATEGORY_ICONS_SELECTION.map(({id, icon: Icon}) => (
                                <button key={id} type="button" onClick={() => setIcon(id)} className={`p-3 rounded-xl ${icon === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400'}`}>
                                    <Icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-2 block">{t.cat_color}</label>
                        <div className="flex gap-2 flex-wrap">
                            {['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'].map(c => (
                                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">{t.create_btn}</button>
                </form>
            </div>
        </div>
    );
}