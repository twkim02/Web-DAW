import React, { useState } from 'react';
import { createPost } from '../../api/posts';

/**
 * 프리셋 공유 모달 (MVP)
 */
const SharePresetModal = ({ preset, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: preset?.title || '',
        description: '',
        isPublished: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!preset || !preset.id) {
            alert('프리셋 정보가 없습니다.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await createPost({
                presetId: preset.id,
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                isPublished: formData.isPublished
            });
            
            alert('게시글이 생성되었습니다!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || '게시글 생성에 실패했습니다.';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 프리셋이 변경되면 제목 업데이트
    React.useEffect(() => {
        if (preset && preset.title) {
            setFormData(prev => ({ ...prev, title: preset.title }));
        }
    }, [preset]);

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
            zIndex: 1001
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '30px',
                borderRadius: '10px',
                minWidth: '400px',
                maxWidth: '500px',
                color: '#fff'
            }} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginTop: 0, marginBottom: '20px' }}>프리셋 공유</h2>

                {error && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '20px',
                        backgroundColor: '#f44336',
                        borderRadius: '5px',
                        color: '#fff'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                제목 <span style={{ color: '#f44336' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '5px',
                                    border: '1px solid #444',
                                    backgroundColor: '#2a2a2a',
                                    color: '#fff',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                설명 (선택사항)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '5px',
                                    border: '1px solid #444',
                                    backgroundColor: '#2a2a2a',
                                    color: '#fff',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Published */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={(e) => handleChange('isPublished', e.target.checked)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <span>공개 게시</span>
                            </label>
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
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '5px',
                                border: '1px solid #444',
                                backgroundColor: '#2a2a2a',
                                color: '#fff',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.5 : 1
                            }}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
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
                            {loading ? '게시 중...' : '게시'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SharePresetModal;
