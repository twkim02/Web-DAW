import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../api/posts';
import { getPresets } from '../../api/presets';
import useStore from '../../store/useStore';

/**
 * 게시글 작성 컴포넌트 (MVP)
 */
const PostCreate = () => {
    const navigate = useNavigate();
    const user = useStore((state) => state.user);
    const [presets, setPresets] = useState([]);
    const [formData, setFormData] = useState({
        presetId: '',
        title: '',
        description: '',
        isPublished: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            alert('로그인이 필요합니다.');
            navigate('/community');
            return;
        }

        const fetchPresets = async () => {
            try {
                const data = await getPresets();
                setPresets(data || []);
            } catch (err) {
                console.error('Failed to fetch presets:', err);
            }
        };

        fetchPresets();
    }, [user, navigate]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.presetId) {
            alert('프리셋을 선택해주세요.');
            return;
        }

        if (!formData.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const post = await createPost({
                presetId: parseInt(formData.presetId),
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                isPublished: formData.isPublished
            });
            alert('게시글이 생성되었습니다!');
            navigate(`/community/${post.id}`);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || '게시글 생성에 실패했습니다.';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', color: '#fff' }}>
            <button
                onClick={() => navigate('/community')}
                style={{
                    padding: '8px 16px',
                    marginBottom: '20px',
                    borderRadius: '5px',
                    border: '1px solid #444',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    cursor: 'pointer'
                }}
            >
                ← 목록으로
            </button>

            <h1 style={{ marginTop: 0 }}>게시글 작성</h1>

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
                    {/* Preset Selection */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            프리셋 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <select
                            value={formData.presetId}
                            onChange={(e) => handleChange('presetId', e.target.value)}
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
                        >
                            <option value="">프리셋 선택</option>
                            {presets.map(preset => (
                                <option key={preset.id} value={preset.id}>
                                    {preset.title} (BPM: {preset.bpm})
                                </option>
                            ))}
                        </select>
                    </div>

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
                            rows={6}
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
                        onClick={() => navigate('/community')}
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
                        {loading ? '작성 중...' : '작성'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostCreate;
