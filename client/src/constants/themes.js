export const THEMES = [
    {
        id: 'cosmic',
        name: 'Cosmic (Default)',
        type: 'dynamic', // Special flag for the existing particle/random logic? Or just specific assets.
        // Let's keep 'cosmic' as the one that uses the BackgroundVisualizer's fancy particle logic.
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
        background: 'linear-gradient(to bottom, #134e5e, #71b280)', // Deep Green gradient
        primaryColor: '#76ff03', // Lime Green
        secondaryColor: '#ffab00', // Amber
        gridColor: 'rgba(118, 255, 3, 0.2)',
        textColor: '#e8f5e9'
    }
];
