import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const SkeletonItem = () => {
        if (type === 'card') {
            return (
                <div className="bg-terminal border border-gray-900 rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-900" />
                    <div className="p-6 space-y-4">
                        <div className="h-4 bg-gray-800 rounded w-3/4" />
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-800 rounded w-full" />
                            <div className="h-3 bg-gray-800 rounded w-5/6" />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                            <div className="h-8 w-24 bg-gray-800 rounded-lg" />
                            <div className="h-4 w-16 bg-gray-800 rounded" />
                        </div>
                    </div>
                </div>
            );
        }

        if (type === 'activity') {
            return (
                <div className="p-3 border-b border-gray-900 animate-pulse flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-gray-800 shrink-0" />
                    <div className="flex-grow space-y-2">
                        <div className="h-2 bg-gray-800 rounded w-1/2" />
                        <div className="h-2 bg-gray-800 rounded w-1/4" />
                    </div>
                </div>
            );
        }

        if (type === 'stat') {
            return (
                <div className="bg-terminal border border-gray-900 p-6 rounded-2xl animate-pulse space-y-3">
                    <div className="h-2 bg-gray-800 rounded w-1/2" />
                    <div className="h-6 bg-gray-800 rounded w-3/4" />
                </div>
            );
        }

        return null;
    };

    return (
        <div className={type === 'card' ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-4"}>
            {Array(count).fill(0).map((_, i) => <SkeletonItem key={i} />)}
        </div>
    );
};

export default SkeletonLoader;
