import React from 'react';

const AppShell = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-2 sm:p-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm mb-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-200 dark:text-slate-800">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
            </div>
        </div>
        {/* Tabs Skeleton */}
        <div className="flex justify-center gap-4 mb-4">
            <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="w-24 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div className="col-span-2 lg:col-span-1 h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
    </div>
);

export default AppShell;
