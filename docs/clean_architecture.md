# Clean Architecture — Implementación Práctica (NestJS + Prisma + Docker)

## 1. Principio Fundamental

### Problema: Acoplamiento
Mezclar lógica de negocio con frameworks, ORM o librerías genera baja mantenibilidad y dependencia tecnológica.

### Solución: Inversión de Dependencias
El dominio es el núcleo. Infraestructura y frameworks son detalles.

---

## 2. Estructura Base

```
src/tasks/
├── domain/
│   ├── entities/      # Reglas puras
|   ├── enums/
|   ├── errors/
│   └── repositories/  # Interfaces (Puertos)
├── application/
|   ├── mappers/
|   ├── dto/   
│   └── use-cases/     # Orquestación
└── infrastructure/
    ├── controllers/   # Entrada HTTP
    ├── persistence/   # Repos reales (Postgres/Mongo)
    ├── decorators/
    ├── guards/
    └── mappers/       # Traductores de datos
```

- Domain: reglas de negocio
- Application: casos de uso
- Infrastructure: DB, HTTP

---

## 3. Dominio

### Entidad
```ts
export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public isCompleted: boolean = false
  ) {
    if (!title || title.length < 3) {
      throw new Error('Título inválido');
    }
  }
}
```

### Repositorio (Interfaz)
```ts
export interface ITaskRepository {
  save(task: Task): Promise<void>;
}
```

---

## 4. DTO

```ts
export class CreateTaskDto {
  title: string;
}
```

---

## 5. Caso de Uso

```ts
export class CreateTaskUseCase {
  constructor(private repo: ITaskRepository) {}

  async execute(title: string) {
    const task = new Task(crypto.randomUUID(), title);
    await this.repo.save(task);
    return task;
  }
}
```

---

## 6. Prisma

```prisma
model TaskModel {
  id String @id
  title String
}
```

---

## 7. Mapper

```ts
static toDomain(model) {
  return new Task(model.id, model.title);
}
```

---

## 8. Repositorio

```ts
@Injectable()
export class Repo implements ITaskRepository {
  async save(task: Task) {}
}
```

---

## 9. Controlador

```ts
@Controller('tasks')
export class Controller {
  constructor(private useCase: CreateTaskUseCase) {}
}
```

---

## 10. Docker

```yaml
services:
  postgres:
    image: postgres
```

---

## 11. Beneficios

- Bajo acoplamiento
- Alta testabilidad
- Escalabilidad
