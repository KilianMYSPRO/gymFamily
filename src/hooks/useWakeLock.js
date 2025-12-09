import { useState, useEffect, useCallback, useRef } from 'react';
import NoSleep from 'nosleep.js';

const useWakeLock = () => {
    const [isLocked, setIsLocked] = useState(false);
    const [type, setType] = useState(null); // 'native' | 'nosleep' | null
    const wakeLockRef = useRef(null);
    const noSleepRef = useRef(null);
    const isLockedRef = useRef(false);
    const typeRef = useRef(null);

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
        // Prevent stacking: If already locked, check if we need to do anything
        if (isLockedRef.current) {
            if (!forceNoSleep) return; // Already locked (native or nosleep), don't need to re-request native.
            if (forceNoSleep && typeRef.current === 'nosleep') return; // Already nosleep
            // If native and forcing nosleep, we proceed to enable nosleep (and release native below)
        }

        // 1. Try Native API first (unless forced to skip)
        if (!forceNoSleep && 'wakeLock' in navigator) {
            try {
                const lock = await navigator.wakeLock.request('screen');
                wakeLockRef.current = lock;
                setIsLocked(true);
                setType('native');
                isLockedRef.current = true;
                typeRef.current = 'native';

                lock.addEventListener('release', () => {
                    // Only reset state if we haven't switched to nosleep or another lock
                    if (wakeLockRef.current === lock) {
                        setIsLocked(false);
                        setType(null);
                        isLockedRef.current = false;
                        typeRef.current = null;
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
                // If we are upgrading from native to nosleep, release native first
                if (wakeLockRef.current) {
                    await wakeLockRef.current.release().catch(e => console.error("Failed to release native lock during upgrade", e));
                    wakeLockRef.current = null;
                }

                await noSleepRef.current.enable();
                setIsLocked(true);
                setType('nosleep');
                isLockedRef.current = true;
                typeRef.current = 'nosleep';
            }
        } catch (err) {
            console.error('NoSleep Wake Lock failed:', err);
            setIsLocked(false);
            setType(null);
            isLockedRef.current = false;
            typeRef.current = null;
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
        isLockedRef.current = false;
        typeRef.current = null;
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
