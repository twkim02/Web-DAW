import React from 'react';
import styles from './SubButton.module.css';

const SubButton = ({ label, onClick, style, isActive }) => {
    return (
        <button
            className={`${styles.button} ${isActive ? styles.active : ''}`}
            onClick={onClick}
            style={style}
        >
            {label}
        </button>
    );
};

export default SubButton;
