import { Banknote, Bitcoin, DollarSign, PieChart, Pencil, Trash2 } from 'lucide-react';
import React, { memo } from 'react';

const AssetItem = memo(({
    asset,
    currency,
    formatMoney,
    t,
    onEditAsset,
    onDeleteAsset,
}) => {
    const totalVal = asset.amount * (asset.valuePerUnit || 1);
    let Icon = Banknote;
    if (asset.type === 'crypto')
        Icon = asset.name.toLowerCase().includes('bitcoin')
            ? Bitcoin
            : DollarSign;
    if (asset.type === 'stock') Icon = PieChart;

    return (
        <div
            className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative group"
        >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEditAsset(asset)}
                    className="text-slate-300 hover:text-blue-500"
                    aria-label={t.edit_asset || 'Edit asset'}
                    title={t.edit_asset}
                >
                    <Pencil size={14} aria-hidden="true" />
                </button>
                <button
                    onClick={() => onDeleteAsset(asset.id)}
                    className="text-slate-300 hover:text-red-500"
                    aria-label={t.delete || 'Delete'}
                    title={t.delete}
                >
                    <Trash2 size={14} aria-hidden="true" />
                </button>
            </div>
            <div className="flex items-center gap-4">
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${asset.type === 'crypto' ? 'bg-orange-100 text-orange-500' : asset.type === 'stock' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'}`}
                >
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg dark:text-white">
                        {asset.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                        {asset.type === 'crypto'
                            ? `${asset.amount} × ${formatMoney(asset.valuePerUnit, currency)}`
                            : asset.type === 'stock'
                                ? t.asset_type_stock
                                : t.asset_type_cash}
                    </p>
                </div>
                <div className="ml-auto text-right">
                    <div className="font-bold text-lg dark:text-white">
                        {formatMoney(totalVal, currency)}
                    </div>
                </div>
            </div>
        </div>
    );
});

AssetItem.displayName = 'AssetItem';

export default AssetItem;
