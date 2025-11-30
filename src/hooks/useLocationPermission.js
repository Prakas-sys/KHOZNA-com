import { useEffect, useState } from 'react';

export const useLocationPermission = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        const requestLocation = () => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                        setPermissionGranted(true);
                        localStorage.setItem('locationPermission', 'granted');
                    },
                    (err) => {
                        setError(err.message);
                        setPermissionGranted(false);
                        localStorage.setItem('locationPermission', 'denied');
                    }
                );
            } else {
                setError('Geolocation is not supported by your browser');
            }
        };

        // Check if permission was previously granted
        const previousPermission = localStorage.getItem('locationPermission');
        if (previousPermission !== 'denied') {
            requestLocation();
        }
    }, []);

    return { location, error, permissionGranted };
};
