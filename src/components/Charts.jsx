import React, { useState, useMemo, memo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// --- OPTIMIZATION: Moved helpers outside component to ensure stability ---

const getColorHex = (tailwindClass) => {
    if (!tailwindClass) return '#94a3b8';
    const colors = {
        'bg-slate-400': '#94a3b8', 'bg-slate-500': '#64748b', 'bg-slate-600': '#475569',
        'bg-red-400': '#f87171', 'bg-red-500': '#ef4444', 'bg-red-600': '#dc2626',
        'bg-orange-400': '#fb923c', 'bg-orange-500': '#f97316', 'bg-orange-600': '#ea580c',
        'bg-amber-400': '#fbbf24', 'bg-amber-500': '#f59e0b', 'bg-amber-600': '#d97706',
        'bg-yellow-400': '#facc15', 'bg-yellow-500': '#eab308', 'bg-yellow-600': '#ca8a04',
        'bg-lime-400': '#a3e635', 'bg-lime-500': '#84cc16', 'bg-lime-600': '#65a30d',
        'bg-green-400': '#4ade80', 'bg-green-500': '#22c55e', 'bg-green-600': '#16a34a',
        'bg-emerald-400': '#34d399', 'bg-emerald-500': '#10b981', 'bg-emerald-600': '#059669',
        'bg-teal-400': '#2dd4bf', 'bg-teal-500': '#14b8a6', 'bg-teal-600': '#0d9488',
        'bg-cyan-400': '#22d3ee', 'bg-cyan-500': '#06b6d4', 'bg-cyan-600': '#0891b2',
        'bg-sky-400': '#38bdf8', 'bg-sky-500': '#0ea5e9', 'bg-sky-600': '#0284c7',
        'bg-blue-400': '#60a5fa', 'bg-blue-500': '#3b82f6', 'bg-blue-600': '#2563eb',
        'bg-indigo-400': '#818cf8', 'bg-indigo-500': '#6366f1', 'bg-indigo-600': '#4f46e5',
        'bg-violet-400': '#a78bfa', 'bg-violet-500': '#8b5cf6', 'bg-violet-600': '#7c3aed',
        'bg-purple-400': '#c084fc', 'bg-purple-500': '#a855f7', 'bg-purple-600': '#9333ea',
        'bg-fuchsia-400': '#e879f9', 'bg-fuchsia-500': '#d946ef', 'bg-fuchsia-600': '#c026d3',
        'bg-pink-400': '#f472b6', 'bg-pink-500': '#ec4899', 'bg-pink-600': '#db2777',
        'bg-rose-400': '#fb7185', 'bg-rose-500': '#f43f5e', 'bg-rose-600': '#e11d48',
    };
    return colors[tailwindClass] || '#94a3b8'; 
};

const processData = (data, total, getCategoryName, otherLabel) => {
    if (!data || total === 0) return [];
    const threshold = 0.03; 
    let mainSegments = [];
    let otherTotal = 0;

    data.forEach(item => {
        const percentage = item.total / total;
        if (percentage < threshold) {
            otherTotal += item.total;
        } else {
            const displayName = getCategoryName ? getCategoryName(item) : item.name;
            mainSegments.push({
                name: displayName, 
                value: item.total,
                color: item.color ? item.color.replace('bg-', '') : 'gray',
                originalColor: item.color,
                percentage: (percentage * 100).toFixed(1)
            });
        }
    });

    if (otherTotal > 0) {
        mainSegments.push({
            name: otherLabel || 'Other',
            value: otherTotal,
            color: 'gray',
            originalColor: 'bg-slate-400',
            percentage: ((otherTotal / total) * 100).toFixed(1),
            isOther: true
        });
    }

    return mainSegments.sort((a, b) => b.value - a.value);
};

export const SimpleDonutChart = memo(({ data, total, currencyCode, formatMoney, label, getCategoryName, otherLabel }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    
    const chartData = useMemo(() => 
        processData(data, total, getCategoryName, otherLabel), 
    [data, total, getCategoryName, otherLabel]);

    const onPieEnter = useCallback((_, index) => setActiveIndex(index), []);
    const onPieLeave = useCallback(() => setActiveIndex(null), []);

    const centerLabel = activeIndex !== null ? chartData[activeIndex].name : label; 
    const centerValue = activeIndex !== null 
        ? formatMoney(chartData[activeIndex].value, currencyCode) 
        : formatMoney(total, currencyCode);

    if (total === 0) return <div className="text-center text-slate-400 py-10">No data</div>;

    return (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
            <div className="relative w-full h-[250px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                            onClick={onPieEnter}
                            cornerRadius={6}
                            stroke="none"
                            cursor="pointer"
                        >
                            {chartData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={getColorHex(entry.originalColor)} 
                                    className="transition-all duration-300 focus:outline-none"
                                    style={{
                                        filter: activeIndex === index ? 'drop-shadow(0px 0px 8px rgba(0,0,0,0.2))' : 'none',
                                        opacity: activeIndex !== null && activeIndex !== index ? 0.6 : 1,
                                        transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                                        transformOrigin: 'center center'
                                    }}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 text-center px-4 truncate w-full">
                        {centerLabel}
                    </span>
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">
                        {centerValue}
                    </span>
                </div>
            </div>

            <div className="w-full mt-4 space-y-3">
                {chartData.map((item, index) => (
                    <div 
                        key={index} 
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${activeIndex === index ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: getColorHex(item.originalColor) }}></div>
                            <span className={`text-sm font-medium ${activeIndex === index ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {item.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold dark:text-white">{formatMoney(item.value, currencyCode)}</span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg min-w-[45px] text-center">{item.percentage}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export const SimpleBarChart = memo(({ data, currency }) => {
    if (!data || data.length === 0) return null;
    const chartData = useMemo(() => [...data].reverse(), [data]);

    return (
        <div className="w-full h-[200px] mt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        dy={10}
                    />
                    <Tooltip 
                        cursor={{fill: 'rgba(0,0,0,0.05)'}}
                        contentStyle={{
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: 'white',
                            color: '#1e293b'
                        }}
                    />
                    <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} name="Income" animationDuration={1000} />
                    <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} name="Expense" animationDuration={1000} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});