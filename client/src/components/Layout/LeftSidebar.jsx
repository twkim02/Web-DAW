import React from 'react';
import TrackList from '../Mixer/TrackList';
import styles from './LeftSidebar.module.css';

function LeftSidebar() {
  return (
    <aside className={styles.leftSidebar}>
      <div className={styles.sidebarContent}>
        <h3 className={styles.sidebarTitle}>Mixer</h3>
        <TrackList />
      </div>
    </aside>
  );
}

export default LeftSidebar;
