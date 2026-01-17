import React, { useState, useRef } from 'react';
import { uploadFile } from '../../api/upload';

const RecordingLibrary = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleRecordToggle = async () => {
        if (!isRecording) {
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const file = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });

                    // Upload
                    try {
                        console.log('Uploading Recording...');
                        const response = await uploadFile(file);
                        const newRec = {
                            id: response.file.id,
                            name: response.file.originalName,
                            date: new Date(),
                            fileUrl: `http://localhost:3001/uploads/${response.file.filename}`,
                            originalName: response.file.originalName,
                            filename: response.file.filename
                        };
                        setRecordings(prev => [newRec, ...prev]);
                        console.log('Recording Saved:', newRec);
                    } catch (err) {
                        console.error('Failed to upload recording', err);
                        alert('Failed to save recording');
                    }

                    // Stop tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Error accessing microphone:', err);
                alert('Could not access microphone');
            }
        } else {
            // Stop Recording
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            }
        }
    };

    const handleDragStart = (e, rec) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'recording',
            // Create a standard asset object that Pad.jsx expects
            asset: {
                id: rec.id,
                originalName: rec.name,
                filename: rec.filename
            }
        }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', padding: '16px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                MY RECORDINGS
            </div>

            <button
                onClick={handleRecordToggle}
                style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '8px',
                    background: isRecording ? '#ff3333' : '#333',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    boxShadow: isRecording ? '0 0 15px rgba(255, 0, 0, 0.5)' : 'none',
                    transition: 'all 0.2s'
                }}
            >
                {isRecording ? '⏺ STOP RECORDING' : '🔴 START RECORDING'}
            </button>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {recordings.length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>No recordings yet.</div>
                )}

                {recordings.map(rec => (
                    <div
                        key={rec.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, rec)}
                        style={{
                            background: '#222',
                            marginBottom: '4px',
                            padding: '10px',
                            borderRadius: '4px',
                            cursor: 'grab',
                            fontSize: '0.85rem',
                            border: '1px solid #663333',
                            color: '#ffcccc'
                        }}
                    >
                        <div>🎤 {rec.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{rec.date.toLocaleTimeString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecordingLibrary;
