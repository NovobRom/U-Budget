import React, { useMemo } from 'react';

export default function NetWorthChart({ data, currency, formatMoney }) {
    // 1. Фільтруємо та парсимо дані (захист від помилок)
    const validData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return data
            .map((d) => ({ ...d, total: parseFloat(d.total) })) // Примусова конвертація в число
            .filter((d) => !isNaN(d.total)); // Відкидаємо зламані записи
    }, [data]);

    if (validData.length < 2) return null;

    // 2. Обчислюємо межі графіка
    const values = validData.map((d) => d.total);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal;

    // 3. Генеруємо точки координат
    const points = validData
        .map((d, i) => {
            const x = (i / (validData.length - 1)) * 100;

            // Логіка Y: якщо змін немає (range === 0), малюємо лінію посередині (50%)
            // Інакше розподіляємо від 10% (низ) до 90% (верх)
            let y = 50;
            if (range > 0) {
                y = 100 - ((d.total - minVal) / range) * 80 - 10;
            }

            return `${x},${y}`;
        })
        .join(' ');

    const fillPath = `${points} 100,100 0,100`;

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
            <h3 className="font-bold text-sm text-slate-500 mb-4 uppercase tracking-wider">
                History
            </h3>
            <div className="h-40 w-full relative group">
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Область заливки */}
                    <polygon points={fillPath} fill="url(#chartGradient)" />

                    {/* Лінія */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Точки та підказки при наведенні */}
                    {validData.map((d, i) => {
                        const x = (i / (validData.length - 1)) * 100;
                        let y = 50;
                        if (range > 0) {
                            y = 100 - ((d.total - minVal) / range) * 80 - 10;
                        }

                        return (
                            <g key={i} className="group/point">
                                {/* Прозора зона для легшого наведення */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="6"
                                    fill="transparent"
                                    className="cursor-pointer"
                                />
                                {/* Видима точка */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    className="fill-white stroke-emerald-500 stroke-2 opacity-0 group-hover/group:opacity-100 transition-opacity"
                                />

                                {/* Tooltip */}
                                <g className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">
                                    <rect
                                        x={x - 20}
                                        y={y - 25}
                                        width="40"
                                        height="18"
                                        rx="4"
                                        fill="#1e293b"
                                    />
                                    <path
                                        d={`M${x},${y - 7} L${x - 4},${y - 12} L${x + 4},${y - 12} Z`}
                                        fill="#1e293b"
                                    />
                                    <text
                                        x={x}
                                        y={y - 14}
                                        fontSize="5"
                                        fill="white"
                                        textAnchor="middle"
                                        fontWeight="bold"
                                    >
                                        {formatMoney(d.total, currency)
                                            .replace(currency, '')
                                            .trim()}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* Дати знизу */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-400 translate-y-4">
                    <span>{validData[0]?.date}</span>
                    <span>{validData[validData.length - 1]?.date}</span>
                </div>
            </div>
        </div>
    );
}
