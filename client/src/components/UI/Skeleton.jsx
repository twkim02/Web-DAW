import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = ({ width, height, borderRadius, style }) => {
    return (
        <div
            className={styles.skeleton}
            style={{
                width,
                height,
                borderRadius,
                ...style
            }}
        />
    );
};

export default Skeleton;
