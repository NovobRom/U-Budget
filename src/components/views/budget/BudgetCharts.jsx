import React, { Suspense, lazy } from 'react';
import { BarChart3 } from 'lucide-react';

const SimpleDonutChart = lazy(() =>
    import('../../Charts').then(module => ({ default: module.SimpleDonutChart }))
);
const SimpleBarChart = lazy(() =>
    import('../../Charts').then(module => ({ default: module.SimpleBarChart }))
);

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}></div>
);

export default function BudgetCharts({
    expensesByCategory, expense, trendsData, currency, formatMoney, t, getCategoryName
}) {
    return (
        <>
            <div className="hidden lg:block space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[400px] h-auto">
                    {expensesByCategory.length > 0 ? (
                        <Suspense fallback={<Skeleton className="w-full h-full rounded-2xl" />}>
                            <SimpleDonutChart data={expensesByCategory} total={expense} currencyCode={currency} formatMoney={formatMoney} label={t.expense} getCategoryName={getCategoryName} otherLabel={t.other} />
                        </Suspense>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm py-10">{t.no_trans || t.no_data}</div>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[350px]">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><BarChart3 className="text-blue-600 dark:text-blue-400" size={20} /> {t.trends_title}</h3>
                    <div className="h-[250px]">
                        <Suspense fallback={<Skeleton className="w-full h-full rounded-2xl" />}>
                            <SimpleBarChart data={trendsData} currency={currency} />
                        </Suspense>
                    </div>
                </div>
            </div>

            <div className="lg:hidden bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center mx-auto w-full min-h-[350px]">
                <Suspense fallback={<Skeleton className="w-64 h-64 rounded-full" />}>
                    <SimpleDonutChart data={expensesByCategory} total={expense} currencyCode={currency} formatMoney={formatMoney} label={t.expense} getCategoryName={getCategoryName} otherLabel={t.other} />
                </Suspense>
            </div>
        </>
    );
}
