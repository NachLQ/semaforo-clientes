/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        verde: { DEFAULT: '#16a34a', claro: '#dcfce7', oscuro: '#166534' },
        ambar: { DEFAULT: '#d97706', claro: '#fef3c7', oscuro: '#92400e' },
        rojo: { DEFAULT: '#dc2626', claro: '#fee2e2', oscuro: '#991b1b' },
      },
    },
  },
  plugins: [],
};
