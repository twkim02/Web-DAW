export const THEMES = [
    {
        id: 'cosmic',
        name: 'Cosmic (Default)',
        type: 'dynamic',
        visualizerMode: 'default',
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', // Fallback
        primaryColor: '#00ffcc', // Cyan
        secondaryColor: '#cc00ff', // Purple
        gridColor: 'rgba(255,255,255,0.1)',
        textColor: '#ffffff'
    },
    {
        id: 'neon',
        name: 'Neon City',
        type: 'static',
        visualizerMode: 'default',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        primaryColor: '#ff0099', // Hot Pink
        secondaryColor: '#00ccff', // Electric Blue
        gridColor: 'rgba(255, 0, 153, 0.2)',
        textColor: '#ffccff'
    },
    {
        id: 'minimal',
        name: 'Minimal Dark',
        type: 'static',
        visualizerMode: 'default',
        background: '#111111',
        primaryColor: '#ffffff', // White
        secondaryColor: '#888888', // Grey
        gridColor: 'rgba(255,255,255,0.05)',
        textColor: '#eeeeee'
    },
    {
        id: 'nature',
        name: 'Forest Rain',
        type: 'static',
        visualizerMode: 'default',
        background: 'linear-gradient(to bottom, #134e5e, #71b280)', // Deep Green gradient
        primaryColor: '#76ff03', // Lime Green
        secondaryColor: '#ffab00', // Amber
        gridColor: 'rgba(118, 255, 3, 0.2)',
        textColor: '#e8f5e9'
    },
    {
        id: 'rainbow',
        name: '🌈 Rainbow',
        type: 'dynamic',
        visualizerMode: 'rainbow',
        background: '#000000',
        primaryColor: '#ffffff',
        secondaryColor: '#ffffff',
        gridColor: 'rgba(255,255,255,0.1)',
        textColor: '#ffffff'
    },
    {
        id: 'bass',
        name: '🔊 Bass Reactive',
        type: 'dynamic',
        visualizerMode: 'bass',
        background: '#000000',
        primaryColor: '#ff0055', // Initial color
        secondaryColor: '#ffaa00',
        gridColor: 'rgba(255, 0, 85, 0.2)',
        textColor: '#ffffff'
    },
    {
        id: 'gradient',
        name: '🎨 Gradient',
        type: 'dynamic',
        visualizerMode: 'gradient',
        background: '#000000',
        primaryColor: '#00ccff',
        secondaryColor: '#aa00ff',
        gridColor: 'rgba(0, 204, 255, 0.2)',
        textColor: '#ffffff'
    }
];
