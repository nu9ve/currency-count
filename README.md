# Cuenta Pesos · Herramienta Vanily

Herramienta gratuita de Vanily, diseñada por Nu9ve, para contar billetes y monedas mexicanas rápidamente desde el celular o una computadora. Puede usarla cualquier negocio para agilizar su corte de caja.

La aplicación permite sumar cada denominación de forma individual, agregar diez piezas con un toque y consultar en tiempo real el total de efectivo y de piezas contadas.

## Funciones

- Billetes mexicanos de $1,000, $500, $200, $100, $50 y $20.
- Monedas de $20, $10, $5, $2, $1, 50¢, 20¢, 10¢ y 5¢.
- Conteo individual al tocar una denominación.
- Botón `×10` para registrar diez piezas rápidamente.
- Botón para restar y corregir errores.
- Subtotal por denominación.
- Total general en pesos mexicanos.
- Resumen de billetes, monedas y piezas.
- Guardado automático de la sesión en `localStorage`.
- Exportación del corte diario a un archivo Excel `.xlsx` con fórmulas y totales.
- Reinicio del conteo con confirmación.
- Interfaz responsive con prioridad para dispositivos móviles.
- Temas claro y oscuro con la identidad visual de Vanily.
- Logo de Vanily en el encabezado y crédito de Nu9ve en el pie.

## Tecnologías

- Next.js 16 con App Router
- React 19
- TypeScript
- CSS nativo
- `next/image` para optimización de imágenes

## Requisitos

- Node.js 20.9 o posterior
- npm

## Instalación

```bash
npm install
```

## Desarrollo

Inicia el servidor local:

```bash
npm run dev
```

Después abre [http://localhost:3000](http://localhost:3000).

## Producción

Genera y ejecuta la compilación optimizada:

```bash
npm run build
npm run start
```

## Calidad de código

```bash
npm run lint
```

## Estructura principal

```text
currency-count/
├── app/
│   ├── globals.css     # Estilos responsive
│   ├── layout.tsx      # Metadatos y layout raíz
│   └── page.tsx        # Interfaz y lógica del contador
├── public/
│   ├── brand/          # Logos de Vanily y Nu9ve
│   └── money/          # Imágenes locales de las denominaciones
├── package.json
└── tsconfig.json
```

## Persistencia y privacidad

El conteo se guarda únicamente en el almacenamiento local del navegador. No se utiliza una base de datos y la información no se envía a ningún servidor.

Limpiar los datos del sitio en el navegador también elimina la sesión guardada.

## Exportar el corte diario

Después de registrar al menos una pieza, utiliza **Exportar Excel** en la barra inferior. El archivo incluye:

- Fecha y zona horaria del corte.
- Denominación y tipo de efectivo.
- Cantidad registrada por denominación.
- Subtotales calculados con fórmulas editables.
- Total contado y resumen de piezas, billetes y monedas.

El archivo se descarga como `corte-pesos-AAAA-MM-DD.xlsx`.

## Imágenes de billetes y monedas

Las imágenes de referencia provienen del catálogo de diseños actuales en circulación de [Banco de México](https://www.banxico.org.mx/billetes-y-monedas/disenos-actuales-circulacion-.html) y se incluyen localmente para evitar dependencias externas durante el uso de la aplicación.
