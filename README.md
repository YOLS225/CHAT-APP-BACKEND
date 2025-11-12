# Chat Backend

Backend d'application de chat en temps réel développé avec NestJS, TypeScript et PostgreSQL.

## Description

Application backend permettant la gestion d'utilisateurs, de salles de discussion (rooms), de messages et de membres de salles avec un système d'authentification JWT et de rôles.

## Architecture

### Structure du projet

```
src/
├── rest/                    # Couche de présentation (Controllers REST)
│   ├── auth/               # Endpoints d'authentification
│   ├── messages/           # Endpoints de gestion des messages
│   ├── rooms/              # Endpoints de gestion des salles
│   ├── room-members/       # Endpoints de gestion des membres
│   └── users/              # Endpoints de gestion des utilisateurs
├── business-logic/          # Couche métier (Services)
│   ├── auth/               # Logique d'authentification
│   ├── messages/           # Logique métier des messages
│   ├── rooms/              # Logique métier des salles
│   ├── room-members/       # Logique métier des membres
│   └── users/              # Logique métier des utilisateurs
├── guard/                   # Sécurité (JWT Guards & Strategies)
├── prisma/                  # Couche d'accès aux données
├── utils/                   # Utilitaires
└── config/                  # Configuration
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
- **PostgreSQL 16.2** - Base de données relationnelle
- **Prisma 6.15** - ORM moderne avec génération de types TypeScript
- Migrations gérées par Prisma

### Authentification & Sécurité
- **JWT (jsonwebtoken)** - Authentification par tokens
- **bcrypt 6.0** - Hachage sécurisé des mots de passe
- Guards et Strategies personnalisés pour NestJS

### Validation & Documentation
- **class-validator** & **class-transformer** - Validation des DTOs
- **Swagger (@nestjs/swagger)** - Documentation API interactive

### Outils de développement
- **Jest** - Framework de tests (unitaires et e2e)
- **ESLint** & **Prettier** - Linting et formatage de code
- **Docker Compose** - Orchestration des services
- **ts-node** & **ts-jest** - Exécution TypeScript

## Modèle de données

### Entités principales

**User** - Utilisateurs de l'application
- `id` (UUID)
- `userName` (unique)
- `email` (unique)
- `password` (hashé)
- `avatar` (optionnel)
- `isOnline` (boolean)
- `lastSeen` (timestamp)
- `status` (ACTIVE, INACTIVE, BANNED, SUSPENDED)

**Room** - Salles de discussion
- `id` (UUID)
- `name`
- `description` (optionnel)
- `isPrivate` (boolean)
- `isDirectMessage` (boolean)
- `maxMembers` (défaut: 100)
- `isActive` (boolean)

**Message** - Messages envoyés dans les salles
- `id` (UUID)
- `content`
- `type` (TEXT, IMAGE, FILE, SYSTEM)
- `senderId` (référence User)
- `roomId` (référence Room)
- `editedAt` (optionnel)
- `isDeleted` (boolean)

**RoomMember** - Membres d'une salle
- `id` (UUID)
- `userId` (référence User)
- `roomId` (référence Room)
- `role` (OWNER, ADMIN, MODERATOR, MEMBER)
- `joinedAt` (timestamp)
- `isActive` (boolean)

### Relations

- Un utilisateur peut envoyer plusieurs messages
- Un utilisateur peut être membre de plusieurs rooms
- Une room contient plusieurs messages et membres
- Relations avec suppression en cascade (onDelete: Cascade)

## Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Démarrer la base de données PostgreSQL
docker-compose up -d

# Générer le client Prisma
npm run db:generate

# Exécuter les migrations
npm run db:migrate
```

## Configuration

Créer un fichier `.env` à la racine avec les variables suivantes:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5469/postgres"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"

# JWT - Access Token (courte durée - 15 minutes)
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_ACCESS_EXPIRES_IN="15m"

# JWT - Refresh Token (longue durée - 7 jours)
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-in-production"
JWT_REFRESH_EXPIRES_IN="7d"
```

Vous pouvez copier le fichier `.env.example` et le renommer en `.env` pour démarrer rapidement.

## Scripts disponibles

### Développement

```bash
# Démarrer en mode développement
npm run start:dev

# Démarrer avec debug
npm run start:debug
```

### Production

```bash
# Build du projet
npm run build

# Démarrer en production
npm run start:prod
```

### Base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer une migration
npm run db:migrate

# Réinitialiser la base de données
npm run db:reset

# Voir le statut des migrations
npm run db:status

# Ouvrir Prisma Studio (interface graphique)
npm run db:studio
```

### Tests

```bash
# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Tests e2e
npm run test:e2e

# Couverture de code
npm run test:cov
```

### Code Quality

```bash
# Linter
npm run lint

# Formatter
npm run format
```

## Fonctionnalités

- Authentification JWT avec guards
- Gestion complète des utilisateurs (CRUD, statut en ligne)
- Système de salles publiques et privées
- Messages directs (DM) entre utilisateurs
- Messages avec support texte, images et fichiers
- Système de rôles granulaire (propriétaire, admin, modérateur, membre)
- Gestion des statuts utilisateurs (actif, inactif, banni, suspendu)
- Soft delete pour les messages
- Documentation API interactive via Swagger
- CORS configuré pour intégration frontend

## Documentation API

Une fois l'application démarrée, la documentation Swagger est accessible à:

```
http://localhost:3001/api
```

## Architecture de sécurité

### Authentification JWT avec Refresh Token

L'application utilise un système d'authentification à deux tokens pour une sécurité renforcée:

**Access Token (courte durée - 15 minutes)**
- Utilisé pour authentifier chaque requête API
- Contient les informations utilisateur (id, email, userName)
- Expire rapidement pour limiter les risques en cas de vol

**Refresh Token (longue durée - 7 jours)**
- Utilisé uniquement pour obtenir un nouveau access token
- Contient uniquement l'ID utilisateur
- N'est pas stocké en base de données (stateless)
- Doit être conservé de manière sécurisée côté client

**Flux d'authentification:**

1. **Login** (`POST /auth/login`)
   - Envoyer email et password
   - Recevoir accessToken et refreshToken
   - Stocker les deux tokens côté client (localStorage, sessionStorage, ou cookies HTTP-only)

2. **Requêtes API authentifiées**
   - Ajouter le header: `Authorization: Bearer {accessToken}`
   - Si le token est expiré (401), utiliser le refresh token

3. **Rafraîchir le token** (`POST /auth/refresh`)
   - Envoyer le refreshToken dans le body
   - Recevoir un nouveau accessToken
   - Mettre à jour l'accessToken stocké

4. **Logout** (`POST /auth/logout/:id`)
   - Supprimer les tokens côté client
   - Mettre l'utilisateur hors ligne côté serveur

**Autres mesures de sécurité:**
- Hachage des mots de passe avec bcrypt
- Guards NestJS pour protéger les routes
- Validation des données avec class-validator
- CORS configuré pour autoriser uniquement les origines de confiance
- Vérification du statut utilisateur (ACTIVE) à chaque authentification

## Base de données

PostgreSQL est exécuté dans un conteneur Docker:
- Port: 5469
- User: postgres
- Password: postgres
- Database: postgres

Les données sont persistées dans un volume Docker `chat-backend_postgres_data`.

## License

UNLICENSED - Projet privé