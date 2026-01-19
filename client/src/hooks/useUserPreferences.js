import { useState, useEffect } from 'react';
import { getUserPreferences, updateUserPreferences } from '../api/userPreferences';

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
    const loadPreferences = async () => {
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
    };

    /**
     * 설정 저장
     * @param {Object} data - 저장할 설정 데이터
     */
    const savePreferences = async (data) => {
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
    };

    return {
        preferences,
        loading,
        error,
        loadPreferences,
        savePreferences
    };
};
