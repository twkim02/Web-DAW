import React from 'react';
import useStore from '../../store/useStore';
import { sequencer } from '../../audio/Sequencer';
import styles from './TrackList.module.css';

const TrackList = () => {
    const tracks = useStore((state) => state.tracks);

    const handleMute = (id) => {
        sequencer.toggleMute(id);
    };

    const handleSolo = (id) => {
        sequencer.toggleSolo(id);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this track?')) {
            sequencer.deleteTrack(id);
        }
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.title}>Loop Mixer</div>

            {tracks.length === 0 && (
                <div className={styles.emptyState}>No loops recorded. Press 'Rec' to start!</div>
            )}

            {tracks.map(track => (
                <div key={track.id} className={styles.trackItem}>
                    <div className={styles.trackInfo}>
                        <span className={styles.trackName}>{track.name}</span>
                    </div>
                    <div className={styles.trackControls}>
                        <button
                            className={`${styles.controlBtn} ${styles.muteBtn} ${track.isMuted ? styles.active : ''}`}
                            onClick={() => sequencer && sequencer.toggleMute(track.id)}
                            title="Mute"
                        >
                            M
                        </button>
                        <button
                            className={`${styles.controlBtn} ${styles.soloBtn} ${track.isSolo ? styles.active : ''}`}
                            onClick={() => sequencer && sequencer.toggleSolo(track.id)}
                            title="Solo"
                        >
                            S
                        </button>
                        <button
                            className={`${styles.controlBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDelete(track.id)}
                            title="Delete"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TrackList;
