# Deploying VIEWORA (Client, Server, DB) to Azure Web App for Containers

This guide explains how to build your 3-container setup (**Client**, **Server**, **Database**) and deploy it to **Microsoft Azure App Service** with a custom domain.

---

## 1. Local Testing (Docker Compose)

Before deploying to Azure, verify that all three tiers build and launch locally on your machine with one command:

```bash
docker compose up --build
```

- **Client Frontend**: `http://localhost:3000`
- **Server API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## 2. Setting Up Azure Infrastructure

Run these commands using the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) (or configure them via the Azure Portal):

### Step A: Login & Create Resource Group
```bash
az login
az group create --name viewora-rg --location centralindia
```

### Step B: Create Azure Container Registry (ACR)
```bash
az acr create --resource-group viewora-rg --name vieworaregistry --sku Basic --admin-enabled true
```

### Step C: Build & Push Docker Images to ACR
```bash
# Log in to your ACR
az acr login --name vieworaregistry

# Build and push server image
docker build -t vieworaregistry.azurecr.io/server:latest ./server
docker push vieworaregistry.azurecr.io/server:latest

# Build and push client image
docker build --build-arg NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api" -t vieworaregistry.azurecr.io/client:latest ./client
docker push vieworaregistry.azurecr.io/client:latest
```

### Step D: Create Managed PostgreSQL Database
```bash
az postgres flexible-server create \
  --resource-group viewora-rg \
  --name viewora-db-server \
  --admin-user dbadmin \
  --admin-password "YourStrongPassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable
```

### Step E: Create App Service Plan & Web Apps
```bash
# Create Linux App Service Plan (Basic B1 Tier)
az appservice plan create --name viewora-plan --resource-group viewora-rg --is-linux --sku B1

# Create Backend Web App
az webapp create --resource-group viewora-rg --plan viewora-plan --name viewora-api-app --deployment-container-image-name vieworaregistry.azurecr.io/server:latest

# Create Frontend Web App
az webapp create --resource-group viewora-rg --plan viewora-plan --name viewora-web-app --deployment-container-image-name vieworaregistry.azurecr.io/client:latest
```

---

## 3. Environment Variables Configuration

Set environment variables in Azure Portal (App Service -> Configuration -> Application settings):

### For `viewora-api-app` (Server):
* `DATABASE_URL`: `postgresql://dbadmin:YourStrongPassword123!@viewora-db-server.postgres.database.azure.com:5432/viewora_db?sslmode=require`
* `PORT`: `5000`
* `NODE_ENV`: `production`
* `JWT_SECRET`: your production JWT key

### For `viewora-web-app` (Client):
* `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api` (or your backend Azure app domain `https://viewora-api-app.azurewebsites.net/api`)

---

## 4. Custom Domain Setup (`www.yourdomain.com`)

1. Go to your Domain Registrar (GoDaddy, Hostinger, Namecheap, Cloudflare).
2. Add DNS Records:
   - **CNAME** for `www` $\rightarrow$ `viewora-web-app.azurewebsites.net`
   - **CNAME** for `api` $\rightarrow$ `viewora-api-app.azurewebsites.net`
3. In Azure Portal:
   - Go to **`viewora-web-app` -> Custom Domains** -> Add `www.yourdomain.com`.
   - Go to **`viewora-api-app` -> Custom Domains** -> Add `api.yourdomain.com`.
   - Click **Add Binding -> App Service Managed Certificate (Free SSL)** to secure your domain with HTTPS.

---

## 5. Summary of Architecture

- **Client App**: Azure Web App for Containers (`viewora-web-app.azurewebsites.net`) $\rightarrow$ Mapped to `www.yourdomain.com` on GoDaddy.
- **Server App**: Azure Web App for Containers (`viewora-api-app.azurewebsites.net`) $\rightarrow$ Mapped to `api.yourdomain.com` on GoDaddy.
- **Database**: Azure Database for PostgreSQL Flexible Server (`viewora-db-server.postgres.database.azure.com`).

