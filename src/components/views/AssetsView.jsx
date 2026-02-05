import {
    Landmark,
    Download,
    Plus,
} from 'lucide-react';
import React, { useMemo } from 'react';
import AssetItem from './AssetItem';

export default function AssetsView({
    assets,
    currency,
    formatMoney,
    t,
    onAddAsset,
    onEditAsset,
    onDeleteAsset,
    onExport,
}) {
    const netWorth = useMemo(() => {
        return assets.reduce((acc, a) => acc + (a.convertedValue || 0), 0);
    }, [assets]);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-emerald-100 font-medium">{t.total_net_worth}</span>
                    <Landmark size={24} className="text-emerald-100 opacity-50" />
                </div>
                <div className="text-3xl font-bold tracking-tight">
                    {formatMoney(netWorth, currency)}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">{t.assets}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onExport}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                        aria-label={t.export || 'Export assets'}
                        title={t.export}
                    >
                        <Download size={16} aria-hidden="true" />
                    </button>
                    <button
                        onClick={onAddAsset}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                        <Plus size={16} /> {t.add_asset}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.length > 0 ? (
                    assets.map((asset) => (
                        <AssetItem
                            key={asset.id}
                            asset={asset}
                            currency={currency}
                            formatMoney={formatMoney}
                            t={t}
                            onEditAsset={onEditAsset}
                            onDeleteAsset={onDeleteAsset}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-slate-400">
                        {t.no_assets}
                    </div>
                )}
            </div>
        </div>
    );
}
