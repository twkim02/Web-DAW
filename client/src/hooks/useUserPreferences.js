import { useState, useCallback } from 'react';
import { getUserPreferences, updateUserPreferences } from '../api/userPreferences';
import useStore from '../store/useStore';

/**
 * 사용자 설정을 관리하는 커스텀 훅
 * @returns {Object} { preferences, loading, error, loadPreferences, savePreferences }
 */
export const useUserPreferences = () => {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * 설정 로드
     */
    const loadPreferences = useCallback(async () => {
        // Guest Check
        const currentUser = useStore.getState().user;
        if (!currentUser) {
            // Guest: Return defaults without API call
            const defaults = {
                latencyMs: 100,
                visualizerMode: null,
                defaultMasterVolume: 0.7
            };
            setPreferences(defaults);
            return defaults;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getUserPreferences();
            setPreferences(data);
            return data;
        } catch (err) {
            setError(err);
            console.error('Failed to load preferences:', err);
            // 에러가 발생해도 기본값을 반환
            return {
                latencyMs: 100,
                visualizerMode: null,
                defaultMasterVolume: 0.7
            };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * 설정 저장
     * @param {Object} data - 저장할 설정 데이터
     */
    const savePreferences = useCallback(async (data) => {
        // Guest Check
        const currentUser = useStore.getState().user;
        if (!currentUser) {
            // Guest: Just update local state (App.jsx store listeners will handle UI)
            // But here we return what we "would" have saved to keep promise chain happy
            setPreferences(prev => ({ ...prev, ...data }));
            return data;
        }

        setLoading(true);
        setError(null);
        try {
            const updated = await updateUserPreferences(data);
            setPreferences(updated);
            return updated;
        } catch (err) {
            setError(err);
            console.error('Failed to save preferences:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        preferences,
        loading,
        error,
        loadPreferences,
        savePreferences
    };
};
