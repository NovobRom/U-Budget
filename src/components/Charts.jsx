import React, { useState, useMemo, memo, useCallback } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';

// --- OPTIMIZATION: Moved helpers outside component to ensure stability ---

import { getColorHex } from '../utils/colors';
import CategoryItem from './CategoryItem';

const processData = (data, total, getCategoryName, otherLabel) => {
    if (!data || total === 0) return [];
    const threshold = 0.03;
    let mainSegments = [];
    let otherTotal = 0;

    data.forEach((item) => {
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
                percentage: (percentage * 100).toFixed(1),
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
            isOther: true,
        });
    }

    return mainSegments.sort((a, b) => b.value - a.value);
};

export const SimpleDonutChart = memo(
    ({ data, total, currencyCode, formatMoney, label, getCategoryName, otherLabel }) => {
        const [activeIndex, setActiveIndex] = useState(null);

        const chartData = useMemo(
            () => processData(data, total, getCategoryName, otherLabel),
            [data, total, getCategoryName, otherLabel]
        );

        const onPieEnter = useCallback((_, index) => setActiveIndex(index), []);
        const onPieLeave = useCallback(() => setActiveIndex(null), []);

        const centerLabel = activeIndex !== null ? chartData[activeIndex].name : label;
        const centerValue =
            activeIndex !== null
                ? formatMoney(chartData[activeIndex].value, currencyCode)
                : formatMoney(total, currencyCode);

        if (total === 0) return <div className="text-center text-slate-400 py-10">No data</div>;

        return (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
                <div className="relative w-full h-[250px]" style={{ minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
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
                                            filter:
                                                activeIndex === index
                                                    ? 'drop-shadow(0px 0px 8px rgba(0,0,0,0.2))'
                                                    : 'none',
                                            opacity:
                                                activeIndex !== null && activeIndex !== index
                                                    ? 0.6
                                                    : 1,
                                            transform:
                                                activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                                            transformOrigin: 'center center',
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
                        <CategoryItem
                            key={index}
                            item={item}
                            index={index}
                            isActive={activeIndex === index}
                            onActivate={setActiveIndex}
                            onDeactivate={() => setActiveIndex(null)}
                            currencyCode={currencyCode}
                            formatMoney={formatMoney}
                        />
                    ))}
                </div>
            </div>
        );
    }
);

export const SimpleBarChart = memo(({ data, currency }) => {
    if (!data || data.length === 0) return null;
    const chartData = useMemo(() => [...data], [data]); // Removed .reverse() because we want chronological order usually? Original had reverse. Let's check trendsData.
    // Original trendsData was "Last 6 months" pushed [5 months ago, 4 months ago... today].
    // If I used push, it's chronological 0..5 (oldest..newest).
    // If original code had .reverse(), maybe it wanted Newest first?
    // Usually Trends are Left (Old) -> Right (New).
    // Original: `for (let i = 5; i >= 0; i--)`. i=5 (5 months ago), i=0 (today).
    // Pushed: [Month-5, Month-4, ..., Month-0].
    // Charts.jsx had `.reverse()`. So it became [Month-0, ..., Month-5].
    // That means Right (Old) -> Left (New)? Or Left (New) -> Right (Old)?
    // BarChart default XAxis is Left->Right (index 0 -> N).
    // If I reverse, index 0 is Month-0 (Today). So Today is Left. 5-Months-Ago is Right.
    // That's weird for a trend chart. Usually Time flows L->R.
    // I will REMOVE .reverse() so it flows Old->New.

    const formatValue = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="w-full h-[200px] mt-4" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                        strokeOpacity={0.5}
                    />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        dy={10}
                    />
                    <YAxis hide={true} />
                    <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: 'white',
                            color: '#1e293b',
                        }}
                        formatter={(value) => [
                            new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: currency,
                            }).format(value),
                            '',
                        ]}
                    />
                    <Bar
                        dataKey="income"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        name="Income"
                        animationDuration={1000}
                    />
                    <Bar
                        dataKey="expense"
                        fill="#EF4444"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        name="Expense"
                        animationDuration={1000}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});
