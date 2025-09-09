# T-News Blog Server

## Структура проекта

```
├── package.json       # Файл с зависимостями и настройками проекта
├── posts.json         # JSON-файл с данными постов
├── users.json         # JSON-файл с данными пользователей
├── README.md          # Документация проекта
├── server.js          # Основной серверный файл (Express.js)
├── public/            # Публичная директория для статических файлов
│   └── uploads/       # Директория для хранения аватаров пользователей
│       ├── alex_smith.png
│       ├── anna_art.png
│       ├── dmitry_dev.png
│       ├── elena_fit.png
│       ├── maria_k.png
│       ├── Profile.svg
│       └── sergey_tech.png
```

## Описание

**Backend:**  
- Node.js  
- Express.js  
- Хранение данных в JSON-файлах

## Запуск

1. Установите зависимости:
    ```bash
    npm install
    ```
2. Запустите сервер:
    ```bash
    npm run start
    ```
    Сервер будет доступен на [http://localhost:3000](http://localhost:3000)

## Структура данных

**Пользователь (`users.json`):**
```json
{
  "id": 1,
  "login": "user_login",
  "password": "password",
  "name": "Имя пользователя",
  "about": "Описание профиля",
  "avatar": "http://localhost:3000/uploads/avatar.png",
  "subscriptions": [2, 3]
}
```

**Пост (`posts.json`):**
```json
{
  "id": 1234567890,
  "author_id": 1,
  "content": "Текст поста",
  "likes": [1, 2, 3],
  "comments": [
    {
      "id": 123,
      "userId": 2,
      "content": "Текст комментария"
    }
  ]
}
```

## Основные файлы

- **server.js** — основной сервер Express, реализующий все API эндпоинты.
- **users.json** — данные пользователей.
- **posts.json** — данные постов.
- **public/uploads/** — директория для хранения аватаров пользователей.

## API Endpoints

### Аутентификация
- `POST /api/register` — регистрация пользователя
- `POST /api/login` — вход
- `POST /api/logout` — выход

### Пользователи
- `GET /api/user/:id/posts` — посты пользователя
- `PATCH /api/user/name` — смена имени
- `PATCH /api/user/about` — смена описания
- `POST /api/subscribe` — подписка/отписка

### Посты
- `GET /api/posts` — получение ленты постов (или поиск)
- `POST /api/posts` — создание поста
- `DELETE /api/posts/:id` — удаление поста

### Лайки
- `POST /api/likes` — лайк/анлайк поста

### Комментарии
- `POST /api/comments` — добавить комментарий
- `DELETE /api/comments/:commentId` — удалить комментарий

### Поиск
- `GET /api/search?q=query` — поиск по пользователям и постам

### Статические файлы
- `GET /users.json` — данные пользователей (без паролей)
- `GET /posts.json` — данные постов

##