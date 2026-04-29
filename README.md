# SQLIA - Plataforma Educativa Interactiva de SQL

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Clean Architecture](https://img.shields.io/badge/Clean_Architecture-Success?style=for-the-badge)

SQLIA es una plataforma educativa interactiva orientada al aprendizaje y evaluación de SQL. Permite a los profesores crear cursos y retos interactivos, y a los estudiantes inscribirse, resolver ejercicios reales de bases de datos y recibir evaluaciones automatizadas.

## 🏛️ Arquitectura del Proyecto (Clean Architecture)

Este repositorio está construido siguiendo estrictamente los principios de **Clean Architecture** (Arquitectura Limpia). El objetivo principal es mantener un alto nivel de mantenibilidad, máxima testabilidad y un nulo acoplamiento con frameworks o librerías externas en el corazón del negocio.

La estructura del código divide las responsabilidades en 3 capas fundamentales por cada módulo (ej. `Auth`, `Courses`, `Challenges`):

1. **Domain (Dominio):**
   - **El corazón del sistema.**
   - Contiene Entidades puras, Interfaces de repositorios (Puertos), Enums y Errores específicos del negocio.
   - **Regla estricta:** NO tiene dependencias hacia fuera (ni de infraestructura, ni del framework HTTP o Base de datos).

2. **Application (Casos de Uso):**
   - Orquesta la lógica e interacciones del sistema.
   - Contiene los Casos de Uso (`UseCases`), DTOs independientes de la red y Mappers de presentación.
   - **Regla estricta:** Depende exclusivamente del Dominio. Define cómo se cumplen los procesos del negocio sin saber *cómo* se guardan los datos o por *dónde* entran las peticiones.

3. **Infrastructure (Infraestructura):**
   - Contiene los detalles de implementación (Base de datos, Framework HTTP NestJS, Librerías externas).
   - Incluye Controladores REST (`Controllers`), Implementaciones de Prisma (`Repositories`), Estrategias de autenticación (JWT) y Mappers de Persistencia.
   - **Regla estricta:** Es la única capa que conoce a NestJS, Prisma o interactúa con el mundo exterior. Interactúa con el interior únicamente implementando los "Puertos" (interfaces) del Dominio o inyectando los Casos de Uso.

## ⚙️ Funcionalidades Principales y Módulos

- **🔐 Módulo de Autenticación y Autorización (`auth`):**
  - Registro y Login seguro basado en JWT.
  - Control de acceso basado en Roles del Dominio (`ADMIN`, `PROFESSOR`, `STUDENT`).
  - Arquitectura totalmente desacoplada (Manejo de excepciones de negocio de forma nativa).

- **📚 Gestión de Cursos (`courses`):**
  - Los profesores pueden crear y administrar laboratorios y cursos (Relación "CourseProfessor").
  - Gestión de grupos y períodos académicos.
  - Los estudiantes pueden realizar sus inscripciones (`Enrollments`).

- **🎯 Motor de Retos y Evaluaciones (`challenges` & `evaluations`):**
  - Creación de desafíos SQL (Challenges) categorizados por dificultad (Easym, Medium, Hard) y Visibilidad.
  - Generación de configuraciones de datos virtuales (`DataGenConfig`).
  - Recepción de evaluaciones (`Evaluations`) y registro de respuestas de los estudiantes garantizando retroalimentación por estados (`QUEUED`, `ACCEPTED`, `WRONG_ANSWER`, `SYNTAX_ERROR`, etc).

## 🚀 Despliegue y Configuración Local

### Requisitos previos
- Node.js (v18+)
- Docker y Docker Compose (para el Sandbox de ejecución y base de datos PostgreSQL)
- NPM o Yarn

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Levantar los servicios de infraestructura (BD)
Use Docker Compose para levantar una instancia robusta de PostgreSQL:
```bash
docker-compose up -d
```

### 3. Configurar base de datos y Prisma
Copie el archivo `.env.example` (en caso de existir) a `.env` y ajuste las credenciales de PostgreSQL.
```bash
# Generar el cliente fuertemente tipado de Prisma
npx prisma generate

# Aplicar las migraciones de base de datos a su PostgreSQL local
npx prisma migrate dev
```

### 4. Ejecución del backend

```bash
# Modo desarrollo con recarga automática
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

## 🧪 Testing

Gracias a la Arquitectura Limpia modularizada, todas las lógicas Core (Dominio y Casos de Uso) pueden ser testeadas unitariamente aislando dependencias volátiles:

```bash
# Ejecutar Tests Unitarios
npm run test

# Ejecución de Tests End-to-End
npm run test:e2e

# Cobertura de Código
npm run test:cov
```

