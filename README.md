# HU Login en localhost - repoGPS

Esta rama contiene la implementación de la historia de usuario de **inicio de sesión** para `repoGPS`, ejecutándose en entorno local con Docker.

## Rama
`feature/usuario-login`

## Qué incluye
- Pantalla de login separada de `App.jsx`
- Inicio de sesión con: (o cualquiera ya agregado con misma contraseña)
  marigza2000@gmail.com
  123456
- Persistencia de sesión con `localStorage`
- Cierre de sesión desde el panel lateral
- Integración con backend local usando Docker Compose
- Acceso al panel de gestión de usuarios después del login

## Cómo levantar el proyecto

Desde la raíz del proyecto:

```bash
docker compose up -d --build
http://localhost:8045
