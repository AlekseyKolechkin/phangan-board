# Bulletin Board (Доска объявлений)

Веб-приложение для размещения объявлений без регистрации. Backend на Spring Boot, Frontend на React.

## Структура проекта

```
bulletin-board/
├── backend/          # Spring Boot приложение
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/bulletinboard/
│   │   │   └── resources/
│   │   └── test/
│   └── pom.xml
├── frontend/         # React приложение (Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## Требования

### Backend
- Java 17+
- Maven 3.8+

### Frontend
- Node.js 18+
- npm 9+

### База данных
- PostgreSQL 15+

## Как поднять БД

### Вариант 1: Docker Compose (рекомендуется)

```bash
docker-compose up -d db
```

### Вариант 2: Docker напрямую

```bash
docker run -d \
  --name bulletinboard-db \
  -p 5432:5432 \
  -e POSTGRES_DB=bulletinboard \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:15
```

### Вариант 3: Локальная установка PostgreSQL

Создайте базу данных `bulletinboard` и пользователя с правами доступа.

## Как собрать и запустить Backend

### Сборка

```bash
cd backend
./mvnw clean install
```

### Запуск тестов

```bash
cd backend
./mvnw test
```

### Запуск приложения

```bash
cd backend
./mvnw spring-boot:run
```

Или с профилем dev:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Backend будет доступен по адресу: http://localhost:8080

### Проверка работоспособности

- Health check: http://localhost:8080/actuator/health
- Ping endpoint: http://localhost:8080/api/ping

## Как запустить Frontend

### Установка зависимостей

```bash
cd frontend
npm install
```

### Запуск dev-сервера

```bash
cd frontend
npm run dev
```

Frontend будет доступен по адресу: http://localhost:5173

### Сборка для продакшена

```bash
cd frontend
npm run build
```

Собранные файлы будут в директории `frontend/dist/`

## Конфигурация

### Backend

Конфигурация через переменные окружения или файл `.env`:

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| DB_URL | URL подключения к PostgreSQL | jdbc:postgresql://localhost:5432/bulletinboard |
| DB_USERNAME | Имя пользователя БД | postgres |
| DB_PASSWORD | Пароль пользователя БД | postgres |
| SERVER_PORT | Порт сервера | 8080 |

### Frontend

Конфигурация через файл `.env`:

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| VITE_API_URL | URL backend API | http://localhost:8080/api |

## Профили Spring Boot

- `dev` - для локальной разработки (подробное логирование)
- `prod` - для продакшена (минимальное логирование)
- `test` - для тестов (H2 in-memory база)

## API Endpoints

### Health Check

- `GET /actuator/health` - статус приложения
- `GET /api/ping` - простой ping endpoint

## Лицензия

MIT
