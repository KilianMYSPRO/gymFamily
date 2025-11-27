import { useState, useEffect, useCallback, useRef } from 'react';
import NoSleep from 'nosleep.js';

const useWakeLock = () => {
    const [isLocked, setIsLocked] = useState(false);
    const [type, setType] = useState(null); // 'native' | 'nosleep' | null
    const wakeLockRef = useRef(null);
    const noSleepRef = useRef(null);

    // Initialize NoSleep instance once
    useEffect(() => {
        noSleepRef.current = new NoSleep();
        return () => {
            if (noSleepRef.current) {
                noSleepRef.current.disable();
            }
        };
    }, []);

    const request = useCallback(async (forceNoSleep = false) => {
        // 1. Try Native API first (unless forced to skip)
        if (!forceNoSleep && 'wakeLock' in navigator) {
            try {
                const lock = await navigator.wakeLock.request('screen');
                wakeLockRef.current = lock;
                setIsLocked(true);
                setType('native');
                console.log('Wake Lock active (Native)');

                lock.addEventListener('release', () => {
                    console.log('Wake Lock released (Native)');
                    // Only reset state if we haven't switched to nosleep or another lock
                    if (wakeLockRef.current === lock) {
                        setIsLocked(false);
                        setType(null);
                        wakeLockRef.current = null;
                    }
                });
                return;
            } catch (err) {
                console.warn(`Native Wake Lock failed: ${err.name}, ${err.message}. Falling back to NoSleep.js.`);
            }
        }

        // 2. Fallback: NoSleep.js
        try {
            if (noSleepRef.current) {
                // NoSleep requires a user gesture to enable on some devices.
                // If this is called from an effect without gesture, it might fail or wait.
                // However, NoSleep.js is designed to handle the video playback.
                // We wrap in a try-catch just in case.
                await noSleepRef.current.enable();
                setIsLocked(true);
                setType('nosleep');
                console.log('Wake Lock active (NoSleep.js)');
            }
        } catch (err) {
            console.error('NoSleep Wake Lock failed:', err);
            setIsLocked(false);
            setType(null);
        }
    }, []);

    const release = useCallback(async () => {
        // Release Native
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch (err) {
                console.error('Failed to release native lock:', err);
            }
            wakeLockRef.current = null;
        }

        // Release NoSleep
        if (noSleepRef.current) {
            noSleepRef.current.disable();
        }

        setIsLocked(false);
        setType(null);
    }, []);

    // Re-acquire on visibility change (Native only needs this usually)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isLocked && type === 'native') {
                request();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isLocked, type, request]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            release();
        };
    }, [release]);

    return { isLocked, type, request, release };
};

export default useWakeLock;
