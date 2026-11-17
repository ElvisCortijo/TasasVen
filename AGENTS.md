# Arquitectura

Tasa Venezuela es una página de referencias cambiarias en español creada con React, TypeScript y TanStack Start sobre Netlify. No requiere backend propio ni persistencia: consulta fuentes públicas desde el navegador.

- `src/routes/index.tsx`: panel, consultas, actualización cada diez minutos, estados por fuente y conversor reversible.
- `src/routes/__root.tsx`: documento HTML en español y metadatos sociales.
- `src/styles.css`: variables de tema, estilos del panel, adaptación móvil y movimiento reducido.
- `src/components/ui/`: componentes reutilizables de la plantilla.
- `netlify.toml` y `vite.config.ts`: despliegue e integración de TanStack Start.

Usar componentes funcionales y TypeScript estricto. Ejecutar consultas solo en efectos o eventos del cliente para conservar la compatibilidad con SSR. Mantener separados los fallos de cada fuente y verificar que los valores sean positivos y finitos. Limpiar intervalos al desmontar. Nunca introducir tasas ficticias ni llamar oficial BCV a un dato de una API internacional sin aclarar su origen. La hora de consulta no representa la fecha de publicación de la fuente. El estado en memoria solo conserva información temporal de la sesión.

La interfaz emplea formato es-VE, zona America/Caracas, azul para divisas y verde para USDT. Mantener accesibilidad de teclado, etiquetas de formulario y estados sin conexión. Los tipos de rutas son generados por TanStack; no editar archivos generados.
