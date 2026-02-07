import React, { memo } from 'react';

import { getColorHex } from '../utils/colors';

const CategoryItem = memo(
    ({ item, index, isActive, onActivate, onDeactivate, currencyCode, formatMoney }) => {
        return (
            <div
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${isActive ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                onMouseEnter={() => onActivate(index)}
                onMouseLeave={onDeactivate}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: getColorHex(item.originalColor) }}
                    ></div>
                    <span
                        className={`text-sm font-medium ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        {item.name}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold dark:text-white">
                        {formatMoney(item.value, currencyCode)}
                    </span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg min-w-[45px] text-center">
                        {item.percentage}%
                    </span>
                </div>
            </div>
        );
    }
);

CategoryItem.displayName = 'CategoryItem';

export default CategoryItem;
