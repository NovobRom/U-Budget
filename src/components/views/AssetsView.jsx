import React, { useMemo } from 'react';
import { Landmark, Download, Plus, Banknote, Bitcoin, DollarSign, PieChart, Pencil, Trash2 } from 'lucide-react';

export default function AssetsView({ 
    assets, currency, formatMoney, t, 
    onAddAsset, onEditAsset, onDeleteAsset, onExport 
}) {
    
    const netWorth = useMemo(() => { 
        return assets.reduce((acc, a) => acc + (a.amount * (a.valuePerUnit || 1)), 0); 
    }, [assets]);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-emerald-100 font-medium">{t.total_net_worth}</span>
                    <Landmark size={24} className="text-emerald-100 opacity-50" />
                </div>
                <div className="text-3xl font-bold tracking-tight">{formatMoney(netWorth, currency)}</div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">{t.assets}</h2>
                <div className="flex gap-2">
                     <button onClick={onExport} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Download size={16}/></button>
                     <button onClick={onAddAsset} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> {t.add_asset}</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.length > 0 ? assets.map(asset => {
                    const totalVal = asset.amount * (asset.valuePerUnit || 1);
                    let Icon = Banknote;
                    if (asset.type === 'crypto') Icon = asset.name.toLowerCase().includes('bitcoin') ? Bitcoin : DollarSign;
                    if (asset.type === 'stock') Icon = PieChart;

                    return (
                        <div key={asset.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditAsset(asset)} className="text-slate-300 hover:text-blue-500"><Pencil size={14}/></button>
                                <button onClick={() => onDeleteAsset(asset.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${asset.type === 'crypto' ? 'bg-orange-100 text-orange-500' : asset.type === 'stock' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500'}`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg dark:text-white">{asset.name}</h3>
                                    <p className="text-xs text-slate-500">
                                        {asset.type === 'crypto' 
                                            ? `${asset.amount} × ${formatMoney(asset.valuePerUnit, currency)}`
                                            : asset.type === 'stock' ? t.asset_type_stock : t.asset_type_cash
                                        }
                                    </p>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="font-bold text-lg dark:text-white">{formatMoney(totalVal, currency)}</div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full text-center py-10 text-slate-400">No assets yet. Add cash, crypto or stocks.</div>
                )}
            </div>
        </div>
    );
}