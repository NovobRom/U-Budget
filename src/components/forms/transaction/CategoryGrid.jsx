import { Star } from 'lucide-react';
import React from 'react';

export default function CategoryGrid({
    categories,
    type,
    category,
    setCategory,
    getCategoryName,
    onAddCategory,
    t,
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase">{t.category}</label>
                <button
                    type="button"
                    onClick={onAddCategory}
                    className="text-xs font-bold text-blue-500 hover:underline"
                >
                    + {t.add_category}
                </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                {categories
                    .filter((c) => c.type === type || c.id === 'other')
                    .map((c) => {
                        const IconToRender = c.icon || Star;
                        const isSelected = category === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategory(c.id)}
                                aria-pressed={isSelected}
                                aria-label={getCategoryName(c)}
                                className={`flex flex-col items-center justify-start p-2 rounded-xl border transition-all gap-1 h-auto min-h-[80px] ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-full flex items-center justify-center text-white text-xs ${c.color || 'bg-slate-400'}`}
                                >
                                    <IconToRender size={14} />
                                </div>
                                <span
                                    className={`text-[10px] leading-tight text-center whitespace-normal break-normal w-full ${isSelected ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}
                                >
                                    {getCategoryName(c)}
                                </span>
                            </button>
                        );
                    })}
            </div>
        </div>
    );
}
