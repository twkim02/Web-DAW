import React from 'react';
import TransportControls from '../Transport/TransportControls';
import SequencerControls from '../Sequencer/SequencerControls';
import SynthControls from '../Synth/SynthControls';
import styles from './RightSidebar.module.css';

function RightSidebar() {
  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.sidebarContent}>
        <section className={styles.section}>
          <h3 className={styles.sidebarTitle}>Transport</h3>
          <TransportControls />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sidebarTitle}>Sequencer</h3>
          <SequencerControls />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sidebarTitle}>Synth</h3>
          <SynthControls />
        </section>
      </div>
    </aside>
  );
}

export default RightSidebar;
