import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    icon = null,
    style = {}
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div
            ref={dropdownRef}
            style={{
                position: 'relative',
                display: 'inline-block',
                minWidth: '120px',
                ...style
            }}
        >
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.2s',
                    borderColor: isOpen ? '#00ffcc' : 'rgba(255, 255, 255, 0.1)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icon && <span>{icon}</span>}
                    <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px'
                    }}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <span style={{
                    fontSize: '0.6rem',
                    marginLeft: '8px',
                    color: '#888',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                }}>▼</span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: 0,
                    width: '100%',
                    minWidth: 'max-content',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            style={{
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                color: option.value === value ? '#00ffcc' : '#ccc',
                                background: option.value === value ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (option.value !== value) e.target.style.background = '#2a2a2a';
                            }}
                            onMouseLeave={(e) => {
                                if (option.value !== value) e.target.style.background = 'transparent';
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
