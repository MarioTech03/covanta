# CoVanta MVP — instrucciones para copiar y ejecutar

Este proyecto es una primera versión funcional de demostración. Incluye una web adaptable a móvil, registro e inicio de sesión, creación de tienda, catálogo, carrito, pedidos y panel básico del vendedor. Los datos del backend se guardan en `server/data/db.json`.

## Requisitos
- Node.js 20 o posterior (incluye npm).
- Conexión a internet para instalar dependencias.

## 1. Instalar
Abre una terminal dentro de la carpeta `covanta-mvp` y ejecuta:

```bash
npm run install:all
```

## 2. Ejecutar en desarrollo
En la misma carpeta:

```bash
npm run dev
```

Abre `http://localhost:5173`. El backend funciona en `http://localhost:4000`.

## 3. Cómo probar
1. Entra a la web y pulsa **Entrar** → **Crear cuenta**.
2. Regístrate con un correo y contraseña de al menos 8 caracteres.
3. Abre **Mi negocio** y crea una tienda.
4. Añade productos desde Explorar.
5. Abre el carrito y continúa para crear un pedido de prueba.
6. Consulta los pedidos desde **Pedidos** o el panel del negocio.

## 4. Reiniciar los datos de demostración
Detén el servidor y elimina `server/data/db.json`. Al reiniciar, se creará una base de datos de demostración con el catálogo inicial. Esto borra las cuentas, tiendas y pedidos guardados localmente.

## 5. Configuración importante antes de publicar
- Define `JWT_SECRET` como una clave aleatoria larga en el entorno del servidor. No uses la clave predeterminada en producción.
- Configura HTTPS, CORS restringido al dominio real, copias de seguridad y almacenamiento persistente.
- Los productos actuales son de demostración; no están conectados a proveedores reales.
- El proceso de pedido NO procesa pagos. No introduzcas datos de tarjeta.
- La facturación de planes premium aún no está implementada.
- Para publicar comercialmente, añade validaciones, limitación de solicitudes, verificación de correo, recuperación de contraseña, controles de seguridad, pruebas y revisión legal.

## 6. Crear una compilación web
```bash
npm run build --prefix client
```
El resultado se crea en `client/dist`.

## 7. Android
Esta entrega es una aplicación web adaptable a Android, no un APK ya compilado. Para generar un APK se debe envolver la web con Capacitor o desarrollar un cliente Android nativo y configurarlo. Un APK no puede generarse solo con copiar este código: requiere el entorno de compilación Android (Android Studio/JDK/SDK) y pruebas en dispositivo.

## Endpoints disponibles
- `GET /api/health`
- `GET /api/products`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me` (autenticado)
- `GET /api/store` y `POST /api/store` (autenticado)
- `POST /api/orders`, `GET /api/orders` (autenticado)
- `GET /api/dashboard` (autenticado)

## Limitaciones conocidas
Es un MVP para desarrollo y pruebas, no una plataforma lista para procesar transacciones reales. La persistencia JSON es sencilla y no adecuada para alta concurrencia o producción; antes del lanzamiento debe migrarse a una base de datos administrada como PostgreSQL, con migraciones, controles de acceso y backups. Las compras son pedidos de prueba y el sistema no descuenta inventario automáticamente.

## 8. Preparar proyecto Android con Capacitor
Después de instalar todas las dependencias, entra a la carpeta `client`:

```bash
cd client
npm run android:init
```

Esto crea la carpeta `android` del proyecto (si todavía no existe). Luego abre esa carpeta con Android Studio, instala el SDK requerido y ejecuta la app en un emulador o teléfono conectado.

Para sincronizar cambios de la web con Android:

```bash
npm run android:sync
```

Para generar un APK de prueba, abre el proyecto Android en Android Studio y utiliza **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Para publicar en Google Play, utiliza **Build > Generate Signed Bundle / APK** y protege la clave de firma. No compartas la clave de firma ni credenciales privadas.

**Nota de conexión:** en un teléfono, `localhost` apunta al propio teléfono y no al computador donde corre el backend. Para pruebas en una red local, configura `VITE_API_URL` con la dirección accesible del servidor, por ejemplo `http://192.168.1.20:4000/api` (sustituye la IP por la de tu computador). Para producción, usa una URL pública con HTTPS. No publiques una app Android configurada con una URL local.
