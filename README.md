# Tasa Venezuela

Página en español con tres referencias cambiarias en bolívares: euro, dólar y USDT. Incluye actualización manual y automática cada diez minutos, estados de conexión y conversión en ambos sentidos.

Utiliza React, TypeScript, TanStack Start, Vite, Tailwind CSS y Lucide. Se despliega en Netlify con el adaptador de TanStack Start.

## Desarrollo local

Con Node.js 22.13 o superior compatible y pnpm, instala las dependencias con `pnpm install` y ejecuta `netlify dev --port 8889`.

## Fuentes

Las consultas se realizan en el navegador. Euro utiliza ExchangeRate-API; dólar intenta exchangerate.host y recurre a ExchangeRate-API si falla. USDT utiliza el Worker proporcionado por el usuario. Las APIs de divisas no garantizan la tasa oficial del BCV; la página muestra esta aclaración y enlaza al banco. El servicio externo debe permitir CORS para ser consultado desde el navegador.

La hora de consulta se muestra en la zona de Caracas. Los fallos conservan los valores de la sesión y los marcan como desactualizados. No se almacenan datos persistentes ni se requieren claves. No se inventan valores cuando las fuentes fallan.
