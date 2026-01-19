import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';

const PresetManagerModal = ({ onClose }) => {
    const { presets, setPresets, user, deletePreset } = useStore();
    const [isLoading, setIsLoading] = useState(false);

    // Initial fetch if needed (though App.jsx usually handles it)
    // We'll rely on store 'presets'

    const handleLoad = async (presetId) => {
        setIsLoading(true);
        // We'll trigger the load logic logic in App.jsx via a custom event or callback? 
        // Or simply import the load function?
        // Ideally, we move the load logic to the store or a helper, but it's currently in App.jsx.
        // For now, let's dispatch a custom event that App.jsx listens to, OR passed as a prop.
        // Actually, we can just use the store to trigger a "load request"?
        // Simpler: Pass `onLoad` prop from App.jsx.

        // Wait... I can't easily pass props if this is opened from anywhere. 
        // But it *is* opened from App.jsx. 
        // Let's assume we pass `onLoad(presetId)` as a prop.
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this preset?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/presets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Update Store
                deletePreset(id);
            } else {
                alert("Failed to delete preset");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting preset");
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                width: '500px', maxHeight: '80vh',
                background: 'rgba(30, 30, 35, 0.9)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#fff'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>📂 Preset Manager</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {presets.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            No presets saved yet.
                        </div>
                    ) : (
                        presets.map(preset => (
                            <div key={preset.id}
                                className="preset-item"
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 15px', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onClick={() => { /* Only select? or Load? Let's just have buttons */ }}
                            >
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{preset.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                        {new Date(preset.createdAt).toLocaleString()} • BPM: {preset.bpm}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onClose(); window.dispatchEvent(new CustomEvent('loadPreset', { detail: preset.id })); }}
                                        style={{
                                            background: '#4CAF50', color: '#fff', border: 'none',
                                            padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem'
                                        }}
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(preset.id, e)}
                                        style={{
                                            background: '#f44336', color: '#fff', border: 'none',
                                            padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default PresetManagerModal;
