# Configuration du Backend Laravel

## ✅ Corrections apportées

1. **`.env.example`** — `DB_CONNECTION` corrigé de `sqlite` → `mysql`
2. **`config/cors.php`** — créé pour autoriser le frontend Next.js (port 3000)
3. **`bootstrap/app.php`** — middleware CORS activé
4. **`HeroSlideController.php`** — règles de validation corrigées (`isActive` en `sometimes|nullable|boolean`)

---

## 🚀 Installation

### 1. Copier le fichier d'environnement
```bash
cp .env.example .env
```

### 2. Configurer MySQL dans `.env`
Ouvrez `.env` et renseignez vos identifiants MySQL :
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=libccr        # ← nom de votre base de données
DB_USERNAME=root          # ← votre utilisateur MySQL
DB_PASSWORD=              # ← votre mot de passe MySQL
```

### 3. Installer les dépendances
```bash
composer install
```

### 4. Générer la clé d'application
```bash
php artisan key:generate
```

### 5. Exécuter les migrations
```bash
php artisan migrate
```

### 6. Lancer le serveur
```bash
php artisan serve
```
Le backend sera accessible sur `http://127.0.0.1:8000`

---

## ⚠️ Problème fréquent : SESSION_DRIVER

Si vous avez une erreur liée à la session ou au cache, vérifiez que dans `.env` :
```
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```
Ces valeurs évitent d'avoir besoin d'une base de données pour les sessions.

---

## 🌐 CORS

Si votre frontend tourne sur un port différent de 3000, modifiez `config/cors.php` :
```php
'allowed_origins' => ['http://localhost:VOTRE_PORT'],
```
