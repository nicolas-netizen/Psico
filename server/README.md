# Psico Server

## Descripción
Servidor backend para la aplicación Psico, manejando planes, tests y usuarios.

## Requisitos Previos
- Node.js (v14 o superior)
- npm

## Instalación
1. Clonar el repositorio
2. Navegar al directorio del servidor
3. Instalar dependencias:
   ```
   npm install
   ```

## Ejecución
- Modo desarrollo:
  ```
  npm run dev
  ```
- Modo producción:
  ```
  npm start
  ```

## Endpoints

### Administrador
- `POST /admin/tests`: Crear un nuevo test
- `POST /admin/planes`: Crear un nuevo plan

### Usuarios
- `GET /tests/:userId`: Obtener tests disponibles para un usuario
- `PUT /usuarios/:userId/plan`: Actualizar plan de un usuario
- `GET /planes`: Obtener todos los planes
- `GET /usuarios`: Obtener todos los usuarios

## Estructura de Archivos
- `planes.json`: Almacena información de planes
- `tests.json`: Almacena información de tests
- `usuarios.json`: Almacena información de usuarios

## Consideraciones
- Los archivos JSON se utilizan como base de datos simple
- Se recomienda implementar una base de datos real para producción
