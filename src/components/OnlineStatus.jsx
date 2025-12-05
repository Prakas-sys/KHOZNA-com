// src/components/OnlineStatus.jsx
// Online/Offline indicator component for KHOZNA.com

import React from 'react';

export default function OnlineStatus({ isOnline, lastSeen, showText = false, size = 'sm' }) {
    // Format last seen time
    const formatLastSeen = (timestamp) => {
        if (!timestamp) return 'Long time ago';

        const now = new Date();
        const lastSeenDate = new Date(timestamp);
        const diffMs = now - lastSeenDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return 'Long time ago';
    };

    // Size variants
    const sizeClasses = {
        xs: 'w-2 h-2',
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const dotSize = sizeClasses[size] || sizeClasses.sm;

    return (
        <div className="flex items-center gap-2">
            {/* Status Dot */}
            <div className="relative">
                <div
                    className={`${dotSize} rounded-full ${isOnline
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-gray-400'
                        }`}
                />
                {isOnline && (
                    <div
                        className={`${dotSize} absolute top-0 left-0 rounded-full bg-green-500 animate-ping opacity-75`}
                    />
                )}
            </div>

            {/* Status Text */}
            {showText && (
                <span className="text-sm text-gray-600">
                    {isOnline ? (
                        <span className="text-green-600 font-medium">Online</span>
                    ) : (
                        <span className="text-gray-500">
                            {formatLastSeen(lastSeen)}
                        </span>
                    )}
                </span>
            )}
        </div>
    );
}