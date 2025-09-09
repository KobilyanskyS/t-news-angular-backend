### Backend
- Node.js v24.4.0
- Express.js
- JSON файлы для хранения данных

### Frontend
- Vanilla JavaScript
- HTML
- CSS/LESS
- Vite

### Запуск (при помощи Docker)

1. **Клонировать репозиторий**
```bash
git clone https://github.com/KobilyanskyS/t-news.git
cd T-News
```

2. **Запустить сервисы**
```bash
docker compose up -d --build
```
   - Будут собраны 2 контейнера: `server` (порт 3000) и `frontend` (порт 5173)
   - Автоматически будут установлены зависимости, фронтенд автоматически соберётся при помощи Vite и также автоматически всё будет запущено

3. **Открыть приложение**
   - http://localhost:5173

4. **Проверить статус и логи**
```bash
docker compose ps
docker compose logs -f server
docker compose logs -f frontend
```

5. **Остановить и удалить контейнеры**
```bash
docker compose down
```

6. **Пересобрать после изменений**
```bash
docker compose build --no-cache
docker compose up -d
```

Примечания:
- В `docker-compose.yml` файлы `users.json`, `posts.json` и папка `public/uploads` проброшены в контейнер сервера. Изменения в них локально сразу видны внутри контейнера без пересборки.
- Переменная `VITE_BACKEND_URL` для фронтенда задаётся автоматически (`http://server:3000`) внутри docker-compose. Снаружи сервер доступен на `http://localhost:3000`.

### Запуск (вручную)

1. **Клонировать репозиторий**
```bash
git clone https://github.com/KobilyanskyS/t-news.git
cd T-News
```

2. **Установить зависимости для сервера**
```bash
npm install
```

3. **Установить зависимости для фронтенда**
```bash
cd frontend
npm install
```

4. **Запуск сервера**
```bash
# В корневой папке проекта
npm run start
```
Сервер запустится на `http://localhost:3000`

5. **Запустите фронтенд**
```bash
# В папке frontend
npm run dev
```
Фронтенд будет доступен на `http://localhost:5173`

## 👤 Логины и пароли созданных пользователей
- alex_smith - password123
- maria_k - password123
- dmitry_dev - password123
- anna_art - password123
- sergey_tech - password123
- elena_fit - password123

## 📁 Структура проекта

```
T-News/
├── frontend/                 # Фронтенд приложение
│   ├── src/
│   │   ├── css/             # Стили LESS/CSS
│   │   │   ├── main.less    # Основные стили
│   │   │   ├── variables.less # Переменные
│   │   │   ├── mixins.less  # Миксины
│   │   │   ├── normalize.css # Сброс стилей
│   │   │   ├── header.less  # Стили заголовка
│   │   │   ├── card.less    # Стили карточек
│   │   │   ├── comments.less # Стили комментариев
│   │   │   ├── profile.less # Стили профиля
│   │   │   ├── search.less  # Стили поиска
│   │   │   ├── index.less   # Стили главной страницы
│   │   │   ├── login_and_register.less # Стили форм
│   │   │   └── notifications.css # Уведомления
│   │   ├── js/              # JavaScript модули
│   │   │   ├── services/    # API сервисы
│   │   │   │   └── api.js   # Единый API слой
│   │   │   ├── components/  # Переиспользуемые компоненты
│   │   │   │   └── postCard.js # Компонент карточки поста
│   │   │   ├── pages/       # Страницы приложения
│   │   │   │   ├── home.js  # Главная страница
│   │   │   │   ├── profile.js # Страница профиля
│   │   │   │   ├── search.js # Страница поиска
│   │   │   │   ├── login.js # Страница входа
│   │   │   │   └── register.js # Страница регистрации
│   │   │   └── shared/      # Общие модули
│   │   │       └── header.js # Скрипт заголовка
│   │   └── font/            # Шрифты Tinkoff Sans
│   ├── public/              # Статические файлы
│   ├── index.html           # Главная страница
│   ├── profile.html         # Страница профиля
│   ├── login.html           # Страница входа
│   ├── register.html        # Страница регистрации
│   ├── search.html          # Страница поиска
│   ├── package.json         # Зависимости фронтенда
│   ├── vite.config.js       # Конфигурация Vite
│   ├── Dockerfile           # Dockerfile для фронтенда
│   └── .gitignore           # Исключения Git
├── server.js                # Сервер Express
├── docker-compose.yml       # Оркестрация Docker (server + frontend)
├── Dockerfile.server        # Dockerfile для сервера
├── posts.json               # Данные постов
├── users.json               # Данные пользователей
├── package.json             # Зависимости сервера
└── package-lock.json        # Блокировка версий
```

## 🔧 API Endpoints

### Аутентификация
- `POST /api/register` - регистрация пользователя
- `POST /api/login` - вход в систему
- `POST /api/logout` - выход из системы
- `GET /api/user` - получение данных текущего пользователя

### Пользователи
- `GET /api/user/:id/posts` - получение постов пользователя по ID
- `PATCH /api/user/name` - изменение имени пользователя
- `PATCH /api/user/about` - изменение описания профиля
- `POST /api/subscribe` - подписка/отписка на пользователя

### Посты
- `GET /api/posts` - получение ленты постов (с поддержкой поиска)
- `POST /api/posts` - создание нового поста
- `DELETE /api/posts/:id` - удаление поста (только автор)

### Лайки
- `POST /api/likes` - поставить/убрать лайк на пост

### Комментарии
- `POST /api/comments` - добавить комментарий к посту
- `DELETE /api/comments/:commentId` - удалить комментарий (только автор)

### Поиск
- `GET /api/search?q=query` - поиск по пользователям и постам

### Статические файлы
- `GET /users.json` - получение данных пользователей (для фронтенда)



### Структура данных

**Пользователь:**
```json
{
  "id": 1,
  "login": "user@example.com",
  "password": "hashed_password",
  "name": "Имя пользователя",
  "about": "Описание профиля",
  "avatar": "/src/images/avatar.png",
  "subscriptions": [2, 3]
}
```

**Пост:**
```json
{
  "id": 1234567890,
  "author_id": 1,
  "author_name": "Имя автора",
  "author_avatar": "/src/images/avatar.png",
  "content": "Текст поста",
  "likes": [1, 2, 3],
  "comments": [
    {
      "id": 123,
      "userId": 2,
      "user_name": "Комментатор",
      "content": "Текст комментария"
    }
  ],
  "created_at": "2024-01-01T12:00:00.000Z"
}
```
