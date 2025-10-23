# Script pour IA de Design - Application de Chat en Temps Réel

## Vue d'ensemble
Cette application est un système de chat en temps réel développé avec NestJS (backend) qui nécessite une interface web moderne et intuitive.

## Fonctionnalités à implémenter dans l'interface

### 🔐 Authentification
- **Connexion utilisateur** : Formulaire avec email/mot de passe
- **Inscription** : Formulaire avec userName, email, mot de passe
- **Gestion de session** : Persistance de la connexion
- **Avatar utilisateur** : Upload et affichage des avatars

### 👥 Gestion des utilisateurs
- **Profil utilisateur** : Affichage/modification du userName, email, avatar
- **Statut en ligne** : Indicateur visuel (vert = en ligne, gris = hors ligne)
- **Dernière connexion** : Affichage du "last seen"
- **Statuts** : ACTIVE, INACTIVE, BANNED, SUSPENDED avec indicateurs visuels

### 💬 Système de messagerie
- **Liste des messages** : Affichage chronologique avec :
  - Contenu du message
  - Nom de l'expéditeur (userName)
  - Horodatage (createdAt)
  - Type de message (TEXT, IMAGE, FILE, SYSTEM)
  - Indicateur de message supprimé
- **Envoi de messages** : Zone de saisie avec support des différents types
- **Modification de messages** : Edition inline des messages envoyés
- **Suppression de messages** : Soft delete avec indication visuelle

### 🏠 Gestion des salles (Rooms)
- **Liste des salles** : Sidebar avec toutes les salles accessibles
- **Création de salon** : Modal avec nom, description, paramètres
- **Paramètres de salon** :
  - Nom et description
  - Privé/Public
  - Nombre maximum de membres
  - Statut actif/inactif
- **Messages directs** : Gestion des conversations privées (isDirectMessage)

### 👤 Membres des salles
- **Liste des membres** : Panel latéral avec tous les participants
- **Rôles** : Badges visuels pour OWNER, ADMIN, MODERATOR, MEMBER
- **Gestion des membres** : Ajouter/retirer des membres (selon permissions)
- **Date d'adhésion** : Affichage du joinedAt

## Structure des APIs disponibles

### Messages
- `POST /messages` - Créer un message
- `GET /messages/room/:roomId` - Récupérer tous les messages d'une salle
- `PUT /messages/:id` - Modifier un message
- `DELETE /messages/:id` - Supprimer un message

### Salles
- `POST /rooms` - Créer une salle
- `GET /rooms` - Lister toutes les salles
- `GET /rooms/:id` - Détails d'une salle
- `PUT /rooms/:id` - Modifier une salle
- `DELETE /rooms/:id` - Supprimer une salle

## Spécifications techniques pour l'IA

### Technologies recommandées
- **Framework** : React avec TypeScript ou Vue.js 3
- **Styling** : TailwindCSS ou Styled Components
- **État global** : Redux Toolkit ou Pinia
- **WebSocket** : Socket.io-client pour le temps réel
- **UI Components** : Headless UI ou Ant Design

### Design System suggéré
- **Couleurs** :
  - Primaire : Bleu (#3B82F6)
  - Secondaire : Gris (#6B7280)
  - Succès : Vert (#10B981)
  - Danger : Rouge (#EF4444)
  - Warning : Orange (#F59E0B)

- **Typographie** :
  - Police principale : Inter ou Roboto
  - Tailles : 12px, 14px, 16px, 18px, 24px, 32px

### Layout principal
```
┌─────────────────────────────────────────────────────────┐
│ Header (Profil utilisateur, déconnexion)               │
├─────────────┬─────────────────────────┬─────────────────┤
│             │                         │                 │
│  Sidebar    │                         │   Members       │
│  (Salles)   │    Zone de messages     │   Panel         │
│             │                         │                 │
│             │                         │                 │
│             ├─────────────────────────┤                 │
│             │ Zone de saisie          │                 │
└─────────────┴─────────────────────────┴─────────────────┘
```

### Fonctionnalités temps réel
- **Messages en direct** : Réception instantanée des nouveaux messages
- **Statut utilisateurs** : Mise à jour en temps réel des statuts en ligne
- **Notifications** : Indicateurs visuels pour nouveaux messages
- **Typing indicators** : Affichage "X est en train d'écrire..."

### Responsive Design
- **Mobile First** : Optimisation pour mobile avec navigation par onglets
- **Tablet** : Adaptation du layout pour tablettes
- **Desktop** : Layout complet avec sidebar fixe

### Accessibilité
- **Contraste** : Respect des normes WCAG 2.1
- **Navigation clavier** : Support complet
- **Screen readers** : Aria labels appropriés
- **Focus management** : Gestion du focus pour les modales

## Prompt suggéré pour l'IA de design

"Crée une interface web moderne pour une application de chat en temps réel. L'application doit avoir une sidebar pour les salles de chat, une zone principale pour afficher les messages avec le nom des expéditeurs, et un panel pour les membres. Utilise un design clean et moderne avec TailwindCSS, des couleurs douces, et assure-toi que l'interface soit responsive. Inclus des indicateurs de statut en ligne, des avatars utilisateurs, et une zone de saisie de messages intuitive. Le design doit être professionnel mais convivial."

## Base de données
L'application utilise PostgreSQL avec Prisma ORM. Les modèles principaux sont :
- **User** : Utilisateurs avec userName, email, avatar, statuts
- **Message** : Messages avec contenu, type, relations sender/room
- **Room** : Salles avec nom, description, paramètres
- **RoomMember** : Association utilisateur-salle avec rôles