# Chat Backend

Backend d'application de chat en temps réel développé avec NestJS, TypeScript et PostgreSQL.

## Description

Application backend permettant la gestion d'utilisateurs, de salles de discussion (rooms), de messages, de membres de salles avec un système d'authentification JWT, de rôles et de statistiques utilisateur.

## Prérequis

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** & **Docker Compose**

## Architecture

### Structure du projet

```
src/
├── rest/                    # Couche de présentation (Controllers REST)
│   ├── auth/               # Endpoints d'authentification
│   ├── messages/           # Endpoints de gestion des messages
│   ├── rooms/              # Endpoints de gestion des salles
│   ├── room-members/       # Endpoints de gestion des membres
│   ├── statistics/         # Endpoints de statistiques
│   ├── storage/            # Endpoints d'upload de fichiers (MinIO)
│   └── users/              # Endpoints de gestion des utilisateurs
├── business-logic/          # Couche métier (Services)
│   ├── auth/               # Logique d'authentification
│   ├── messages/           # Logique métier des messages
│   ├── rooms/              # Logique métier des salles
│   ├── room-members/       # Logique métier des membres
│   ├── statistics/         # Logique métier des statistiques
│   ├── storage/            # Logique d'upload (MinIO)
│   └── users/              # Logique métier des utilisateurs
├── guard/                   # Sécurité (JWT Guards & Strategies)
├── prisma/                  # Couche d'accès aux données
└── utils/                   # Utilitaires
```

### Principes architecturaux

- Séparation claire entre les contrôleurs REST et la logique métier
- Pattern Service-Repository (via Prisma)
- Modules NestJS pour l'encapsulation et l'injection de dépendances
- Architecture en couches (Layered Architecture)

## Technologies utilisées

### Framework & Runtime
- **NestJS 11.x** - Framework Node.js progressif
- **Node.js** avec **TypeScript 5.7**
- **Express** - Serveur HTTP

### Base de données & ORM
- **PostgreSQL** - Base de données relationnelle
- **Prisma** - ORM moderne avec génération de types TypeScript
- Migrations gérées par Prisma

### Stockage de fichiers
- **MinIO** - Stockage objet compatible S3 (avatars, fichiers)

### Authentification & Sécurité
- **JWT (jsonwebtoken)** - Access token (25min) + Refresh token (7j)
- **bcrypt** - Hachage sécurisé des mots de passe
- Guards personnalisés pour NestJS

### Validation & Documentation
- **class-validator** & **class-transformer** - Validation des DTOs
- **Swagger (@nestjs/swagger)** - Documentation API interactive

### Outils de développement
- **Jest** - Framework de tests
- **ESLint** & **Prettier** - Linting et formatage de code
- **Docker Compose** - Orchestration des services

## Modèle de données

### Entités principales

**User**
- `id` (UUID), `userName` (unique), `email` (unique), `password` (hashé)
- `avatar` (optionnel), `isOnline`, `lastSeen`
- `status` : `ACTIVE` | `INACTIVE` | `BANNED` | `SUSPENDED`

**Room**
- `id` (UUID), `name`, `description` (optionnel)
- `isPrivate`, `isDirectMessage`, `maxMembers` (défaut: 100), `isActive`

**Message**
- `id` (UUID), `content`, `type` : `TEXT` | `IMAGE` | `FILE` | `SYSTEM`
- `senderId`, `roomId`, `editedAt` (optionnel), `isDeleted`

**RoomMember**
- `id` (UUID), `userId`, `roomId`
- `role` : `OWNER` | `ADMIN` | `MODERATOR` | `MEMBER`
- `joinedAt`, `isActive`

## Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer PostgreSQL et MinIO via Docker
docker compose up -d

# Générer le client Prisma
npm run db:generate

# Exécuter les migrations
npm run db:migrate
```

## Configuration

Créer un fichier `.env` à la racine :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5469/postgres?schema=public"
PORT=9000

JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="25min"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

MINIO_ENDPOINT=localhost
MINIO_PORT=9001
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=chat-app
```

## Services Docker

Le fichier `compose.yaml` démarre deux services :

| Service    | Description                          | Port(s)              |
|------------|--------------------------------------|----------------------|
| `postgres` | Base de données PostgreSQL 16.2      | `5469` → `5432`      |
| `minio`    | Stockage objet S3-compatible         | `9001` (API), `9002` (Console) |

Les données sont persistées dans les volumes Docker `chat-backend_postgres_data` et `minio_data`.

## Scripts disponibles

```bash
# Développement
npm run start:dev

# Production
npm run build && npm run start:prod

# Base de données
npm run db:generate    # Générer le client Prisma
npm run db:migrate     # Créer/appliquer les migrations
npm run db:reset       # Réinitialiser la base de données
npm run db:status      # Vérifier le statut des migrations
npm run db:studio      # Interface graphique Prisma Studio

# Tests
npm run test           # Lancer les tests unitaires
npm run test:watch     # Mode watch
npm run test:cov       # Avec rapport de couverture
npm run test:e2e       # Tests end-to-end

# Qualité
npm run lint
npm run format
```

## API Endpoints

> Tous les endpoints sauf `POST /users`, `POST /auth/login` et `POST /auth/refresh` nécessitent un header `Authorization: Bearer <token>`.

### Auth
| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/login` | Connexion (retourne access + refresh token) |
| POST | `/auth/refresh` | Renouveler l'access token |
| POST | `/auth/logout/:id` | Déconnexion |

### Users
| Méthode | Route | Description |
|---|---|---|
| POST | `/users` | Créer un compte utilisateur |
| GET | `/users?page&page_size&search` | Lister les utilisateurs |
| GET | `/users/:id` | Récupérer un utilisateur |
| PATCH | `/users/:id` | Modifier `userName`, `email`, `avatar` |
| PATCH | `/users/:id/password` | Modifier le mot de passe |
| DELETE | `/users/:id` | Désactiver (soft delete) |
| DELETE | `/users/force/:id` | Supprimer définitivement |

### Rooms
| Méthode | Route | Description |
|---|---|---|
| POST | `/rooms` | Créer une room |
| GET | `/rooms?page&page_size&search&isDirectMessage` | Lister les rooms |
| GET | `/rooms/:id` | Récupérer une room |
| GET | `/rooms/members/:id` | Membres d'une room |
| GET | `/rooms/user-rooms/:id?isDirectMessage&search` | Rooms d'un utilisateur |
| PATCH | `/rooms/:id` | Modifier une room |
| DELETE | `/rooms/:id` | Supprimer une room |

### Messages
| Méthode | Route | Description |
|---|---|---|
| POST | `/messages` | Envoyer un message |
| GET | `/messages/:id` | Récupérer un message |
| GET | `/messages/room/:id?search` | Messages d'une room |
| PATCH | `/messages/:id` | Modifier un message |
| DELETE | `/messages/:id` | Supprimer un message |

### Room Members
| Méthode | Route | Description |
|---|---|---|
| POST | `/room-members` | Rejoindre une room (avec `role` optionnel) |
| GET | `/room-members?page&page_size` | Lister les membres |
| GET | `/room-members/:id` | Récupérer un membre |
| PATCH | `/room-members/:memberId/role` | Modifier le rôle d'un membre |
| PATCH | `/room-members/leave/:id` | Quitter une room |
| DELETE | `/room-members/:memberId/kick` | Exclure un membre |
| DELETE | `/room-members/:id` | Supprimer un membre |

### Storage
| Méthode | Route | Description |
|---|---|---|
| POST | `/storage/upload/avatar/:userId` | Upload d'avatar (multipart/form-data) |

### Statistics
| Méthode | Route | Description |
|---|---|---|
| GET | `/statistics/user/:userId/messages-by-day?days` | Messages par jour |
| GET | `/statistics/user/:userId/average-response-time?days` | Temps de réponse moyen |
| GET | `/statistics/user/:userId/top-conversations?limit` | Top conversations |
| GET | `/statistics/user/:userId/active-conversations?days` | Conversations actives |
| GET | `/statistics/user/:userId/recent-activities?limit` | Activités récentes |
| GET | `/statistics/user/:userId/overview?days&limit` | Vue d'ensemble complète |

## Authentification

Flux standard :

1. **Créer un compte** → `POST /users`
2. **Login** → `POST /auth/login` → reçoit `token` + `refreshToken`
3. **Requêtes** → header `Authorization: Bearer {token}`
4. **Token expiré** → `POST /auth/refresh` avec le `refreshToken`
5. **Logout** → `POST /auth/logout/:id`

## Documentation API interactive

```
http://localhost:9000/api
```

## License

UNLICENSED - Projet privé