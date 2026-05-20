export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        coal: '#222222',
        pulse: '#89E900',
        mint: '#00C896'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 34px rgba(137, 233, 0, 0.24)',
        neumorph: '10px 10px 30px rgba(0,0,0,.35), -10px -10px 30px rgba(255,255,255,.04)'
      }
    }
  },
  plugins: []
};
