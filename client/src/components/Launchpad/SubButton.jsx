import React from 'react';
import styles from './SubButton.module.css';

const SubButton = ({ label, onClick, style }) => {
    return (
        <button
            className={styles.subButton}
            onClick={onClick}
            style={style}
        >
            {label}
        </button>
    );
};

export default SubButton;
