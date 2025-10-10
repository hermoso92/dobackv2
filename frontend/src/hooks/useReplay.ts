import { useCallback, useState } from 'react';
import { EventDTO, TelemetryPointDTO } from '../types/telemetry';
import { logger } from '../utils/logger';

// Hook para replay de telemetría
export const useReplay = (points: TelemetryPointDTO[]) => {
    const [replayState, setReplayState] = useState({
        isPlaying: false,
        currentIndex: 0,
        speed: 1 as 1 | 5 | 10,
        totalPoints: points.length
    });

    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const play = useCallback(() => {
        if (replayState.currentIndex >= points.length - 1) {
            setReplayState(prev => ({ ...prev, currentIndex: 0 }));
        }

        setReplayState(prev => ({ ...prev, isPlaying: true }));

        const interval = setInterval(() => {
            setReplayState(prev => {
                if (prev.currentIndex >= points.length - 1) {
                    clearInterval(interval);
                    return { ...prev, isPlaying: false, currentIndex: 0 };
                }
                return { ...prev, currentIndex: prev.currentIndex + 1 };
            });
        }, 1000 / replayState.speed);

        setIntervalId(interval);
    }, [points.length, replayState.currentIndex, replayState.speed]);

    const pause = useCallback(() => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        setReplayState(prev => ({ ...prev, isPlaying: false }));
    }, [intervalId]);

    const stop = useCallback(() => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        setReplayState(prev => ({ ...prev, isPlaying: false, currentIndex: 0 }));
    }, [intervalId]);

    const setSpeed = useCallback((speed: 1 | 5 | 10) => {
        setReplayState(prev => ({ ...prev, speed }));
    }, []);

    const setCurrentIndex = useCallback((index: number) => {
        const clampedIndex = Math.max(0, Math.min(index, points.length - 1));
        setReplayState(prev => ({ ...prev, currentIndex: clampedIndex }));
    }, [points.length]);

    const currentPoint = points[replayState.currentIndex] || null;

    // Auto-pause en eventos críticos
    const checkForCriticalEvents = useCallback((events: EventDTO[]) => {
        if (!currentPoint || !replayState.isPlaying) return;

        const criticalEvents = events.filter(event =>
            event.severity === 'HIGH' || event.severity === 'CRITICAL'
        );

        const nearbyCriticalEvent = criticalEvents.find(event => {
            const timeDiff = Math.abs(
                new Date(event.ts).getTime() - new Date(currentPoint.ts).getTime()
            );
            return timeDiff < 30000; // 30 segundos
        });

        if (nearbyCriticalEvent) {
            pause();
            logger.info('Replay pausado por evento crítico', {
                event: nearbyCriticalEvent,
                point: currentPoint
            });
        }
    }, [currentPoint, replayState.isPlaying, pause]);

    return {
        replayState,
        currentPoint,
        play,
        pause,
        stop,
        setSpeed,
        setCurrentIndex,
        checkForCriticalEvents
    };
};
