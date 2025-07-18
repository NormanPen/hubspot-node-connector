# 🔗 HubSpot OAuth Node API

Dieses Projekt bietet eine einfache Node.js- und Express-basierte API, mit der sich Benutzer über OAuth mit HubSpot verbinden können. Die Access- und Refresh-Tokens werden in einer PostgreSQL-Datenbank gespeichert und bei Ablauf automatisch aktualisiert.

---

## 🚀 Features

- 🔐 OAuth 2.0-Autorisierung mit HubSpot
- 💾 Speicherung von `access_token` und `refresh_token` in PostgreSQL
- 🔄 Automatischer Token-Refresh bei Ablauf
- 📡 Beispiel-API-Call zu HubSpot (`/crm/v3/objects/contacts`)
- 👤 Tokens sind einem benutzerdefinierten `user_id` zugeordnet

---

## 🧰 Technologien

- Node.js + Express
- PostgreSQL
- Axios
- dotenv
- qs

---

## ⚙️ Setup

### 1. .env-Datei anlegen

```env
PORT=3001
HUBSPOT_CLIENT_ID=<deine-client-id>
HUBSPOT_CLIENT_SECRET=<dein-client-secret>
HUBSPOT_REDIRECT_URI=http://localhost:3001
DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/<db>

