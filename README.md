# Chat Backend

Backend d'application de chat en temps réel développé avec NestJS, TypeScript et PostgreSQL.

## Description

Application backend permettant la gestion d'utilisateurs, de salles de discussion (rooms), de messages, de membres de salles avec un système d'authentification JWT, de rôles et de statistiques utilisateur.

L'application est orientée entreprise : les utilisateurs, rooms, DMs et invitations sont organisés par workspace.

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
│   ├── workspaces/         # Endpoints entreprise, membres, import CSV, DMs
│   └── users/              # Endpoints de gestion des utilisateurs
├── business-logic/          # Couche métier (Services)
│   ├── auth/               # Logique d'authentification
│   ├── messages/           # Logique métier des messages
│   ├── rooms/              # Logique métier des salles
│   ├── room-members/       # Logique métier des membres
│   ├── statistics/         # Logique métier des statistiques
│   ├── workspaces/         # Logique workspace, import CSV et invitations
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
- `password` peut être vide pour un utilisateur invité
- `platformRole` : `SUPER_ADMIN` | `USER`

**Room**
- `id` (UUID), `name`, `description` (optionnel)
- `workspaceId`, `isPrivate`, `isDirectMessage`, `maxMembers` (défaut: 100), `isActive`

**Workspace**
- `id` (UUID), `name`
- Regroupe les utilisateurs, rooms et conversations directes d'une entreprise

**Message**
- `id` (UUID), `content`, `type` : `TEXT` | `IMAGE` | `FILE` | `SYSTEM`
- `senderId`, `roomId`, `editedAt` (optionnel), `isDeleted`

**RoomMember**
- `id` (UUID), `userId`, `roomId`
- `role` : `OWNER` | `ADMIN` | `MODERATOR` | `MEMBER`
- `joinedAt`, `isActive`

**WorkspaceMember**
- `id` (UUID), `userId`, `workspaceId`
- `role` : `OWNER` | `ADMIN` | `MEMBER`
- `status` : `ACTIVE` | `INVITED` | `DISABLED`

### Rôles et permissions

**SUPER_ADMIN**
- Crée les workspaces.
- Devient `OWNER` du workspace créé.

**Workspace OWNER**
- Invite/import des utilisateurs.
- Modifie les rôles et statuts des membres du workspace.
- Peut promouvoir un autre membre en `OWNER`.
- Gère les rooms du workspace.

**Workspace ADMIN**
- Invite/import des utilisateurs.
- Modifie ou désactive les membres simples.
- Ne peut pas gérer un `OWNER`.
- Gère les rooms du workspace.

**Workspace MEMBER**
- Peut créer des DMs avec les membres actifs du même workspace.
- Peut accéder uniquement aux rooms dont il est membre.
- Peut envoyer/lire des messages dans ses rooms.

**InvitationToken**
- Token temporaire permettant à un utilisateur invité de définir son mot de passe

## Installation

### Avec Docker (recommandé)

```bash
# Configurer les variables d'environnement
cp .env.example .env

# Build et démarrage des services (app + postgres)
make build
```

Les migrations sont appliquées automatiquement au démarrage du container.

### En local (développement)

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer PostgreSQL
make up

# Générer le client Prisma et appliquer les migrations
npm run db:generate
npm run db:migrate

# Lancer le serveur en mode watch
npm run start:dev
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

MAIL_DRIVER=console
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-brevo-login"
SMTP_PASS="your-brevo-password"
MAIL_FROM="Chat App <noreply@example.com>"
```

### Configuration email

Les invitations utilisateur peuvent etre envoyees automatiquement par email.

En developpement, utiliser le mode console:

```env
MAIL_DRIVER=console
```

Dans ce mode, aucun email reel n'est envoye. Le backend log les liens d'invitation et les retourne aussi dans la reponse d'import.

En production avec Brevo SMTP:

```env
MAIL_DRIVER=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-brevo-login"
SMTP_PASS="your-brevo-password"
MAIL_FROM="Chat App <noreply@your-domain.com>"
FRONTEND_URL="https://your-frontend-domain.com"
```

`FRONTEND_URL` sert a construire les liens:

```txt
https://your-frontend-domain.com/accept-invitation?token=...
```

Pendant un import Excel, l'API retourne un statut par utilisateur:

- `emailSent: true` : email envoye.
- `emailSkipped: true` : mode console, pas d'envoi reel.
- `emailError` : l'utilisateur et l'invitation sont crees, mais l'email a echoue.

## Services Docker

Le fichier `compose.yaml` démarre deux services :

| Service    | Description                          | Port(s)                        |
|------------|--------------------------------------|--------------------------------|
| `app`      | API NestJS                           | `9000`                         |
| `postgres` | Base de données PostgreSQL 16.2      | `5469` → `5432`                |

### Commandes Make

```bash
make build   # Build l'image et démarre tous les services
make up      # Démarre les services sans rebuild
make down    # Arrête et supprime les containers + volumes
make reset   # Repart de zéro (down + build)
```

Les données PostgreSQL sont persistées dans le volume Docker `chat-backend_postgres_data`.

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
| POST | `/auth/accept-invitation` | Accepter une invitation et définir un mot de passe |
| POST | `/auth/logout/:id` | Déconnexion |

### Workspaces
| Méthode | Route | Description |
|---|---|---|
| POST | `/workspaces` | Créer un workspace |
| GET | `/workspaces` | Lister les workspaces de l'utilisateur connecté |
| GET | `/workspaces/:workspaceId/users?search` | Lister les utilisateurs du workspace |
| PATCH | `/workspaces/:workspaceId/users/:userId` | Modifier rôle/statut d'un membre |
| DELETE | `/workspaces/:workspaceId/users/:userId` | Désactiver un membre du workspace |
| POST | `/workspaces/:workspaceId/users/import/excel?dryRun=true` | Importer des utilisateurs depuis Excel/CSV multipart |
| POST | `/workspaces/:workspaceId/dms` | Créer ou récupérer une conversation directe |

### Users
| Méthode | Route | Description |
|---|---|---|
| POST | `/users` | Créer un compte utilisateur |
| GET | `/users?page&page_size&workspaceId&search` | Lister les utilisateurs accessibles dans un workspace |
| GET | `/users/:id` | Récupérer un utilisateur |
| PATCH | `/users/:id` | Modifier `userName`, `email`, `avatar` |
| PATCH | `/users/:id/password` | Modifier le mot de passe |
| DELETE | `/users/:id` | Désactiver (soft delete) |
| DELETE | `/users/force/:id` | Supprimer définitivement |

### Rooms
| Méthode | Route | Description |
|---|---|---|
| POST | `/rooms` | Créer une room dans un workspace |
| GET | `/rooms?page&page_size&workspaceId&search&isDirectMessage` | Lister les rooms d'un workspace |
| GET | `/rooms/:id` | Récupérer une room |
| GET | `/rooms/members/:id` | Membres d'une room |
| GET | `/rooms/user-rooms/:id?workspaceId&isDirectMessage&search` | Rooms d'un utilisateur dans un workspace |
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
