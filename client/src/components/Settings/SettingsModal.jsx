import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../hooks/useUserPreferences';

/**
 * 사용자 설정 모달 (MVP)
 */
const SettingsModal = ({ isOpen, onClose }) => {
    const { preferences, loading, loadPreferences, savePreferences } = useUserPreferences();
    
    const [formData, setFormData] = useState({
        latencyMs: 100,
        visualizerMode: '',
        defaultMasterVolume: 0.7
    });

    // 모달이 열릴 때 설정 로드
    useEffect(() => {
        if (isOpen && !preferences) {
            loadPreferences();
        }
    }, [isOpen]);

    // preferences가 로드되면 폼에 반영
    useEffect(() => {
        if (preferences) {
            setFormData({
                latencyMs: preferences.latencyMs || 100,
                visualizerMode: preferences.visualizerMode || '',
                defaultMasterVolume: preferences.defaultMasterVolume || 0.7
            });
        }
    }, [preferences]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            await savePreferences({
                latencyMs: parseInt(formData.latencyMs) || 100,
                visualizerMode: formData.visualizerMode || null,
                defaultMasterVolume: parseFloat(formData.defaultMasterVolume) || 0.7
            });
            alert('설정이 저장되었습니다.');
            onClose();
        } catch (err) {
            alert('설정 저장에 실패했습니다: ' + (err.response?.data?.message || err.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '30px',
                borderRadius: '10px',
                minWidth: '400px',
                maxWidth: '500px',
                color: '#fff'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px' }}>설정</h2>

                {loading && <p>로딩 중...</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Latency */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            오디오 레이턴시 (ms)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.latencyMs}
                            onChange={(e) => handleChange('latencyMs', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #444',
                                backgroundColor: '#2a2a2a',
                                color: '#fff'
                            }}
                        />
                    </div>

                    {/* Visualizer Mode */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            비주얼라이저 모드
                        </label>
                        <select
                            value={formData.visualizerMode}
                            onChange={(e) => handleChange('visualizerMode', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #444',
                                backgroundColor: '#2a2a2a',
                                color: '#fff'
                            }}
                        >
                            <option value="">기본값</option>
                            <option value="waveform">Waveform</option>
                            <option value="spectrum">Spectrum</option>
                            <option value="bars">Bars</option>
                        </select>
                    </div>

                    {/* Default Master Volume */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            기본 마스터 볼륨: {Math.round(formData.defaultMasterVolume * 100)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={formData.defaultMasterVolume}
                            onChange={(e) => handleChange('defaultMasterVolume', e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '30px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            backgroundColor: '#2a2a2a',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1
                        }}
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
