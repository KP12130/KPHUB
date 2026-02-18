import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsChart = ({ data, dataKey = "views", color = "#39FF14", label = "Views" }) => {
    // Determine gradient ID based on color
    const gradientId = `color${dataKey}`;

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-black/20 border border-gray-800 rounded-xl">
                <p className="text-gray-500 font-mono text-xs">NO_DATA_STREAM</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full bg-black/20 border border-gray-800 rounded-xl p-4 relative overflow-hidden">
            <h3 className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest flex items-center justify-between">
                <span>{label}_History</span>
                <span className="text-xs text-white font-mono">{data[data.length - 1][dataKey]} (Current)</span>
            </h3>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 0,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#666"
                        tick={{ fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#666"
                        tick={{ fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#000',
                            border: `1px solid ${color}`,
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: color }}
                        labelStyle={{ color: '#888', marginBottom: '5px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AnalyticsChart;
