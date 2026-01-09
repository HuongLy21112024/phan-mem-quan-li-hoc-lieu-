# ============================================
# SmartLearn Deployment Script for Windows
# Run this script with: .\deploy-windows.ps1
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SmartLearn Deployment Script (Windows)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ========== 1. CHECK DOCKER ==========
Write-Host "`n[1/7] Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# ========== 2. CHECK DOCKER RUNNING ==========
Write-Host "`n[2/7] Checking if Docker Desktop is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "Docker Desktop is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "Waiting 45 seconds for Docker Desktop to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 45
    
    # Retry check
    try {
        docker ps | Out-Null
        Write-Host "Docker Desktop started successfully" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Docker Desktop failed to start. Please start it manually and run this script again." -ForegroundColor Red
        exit 1
    }
}

# ========== 3. START CONTAINERS ==========
Write-Host "`n[3/7] Starting Docker containers..." -ForegroundColor Yellow
docker compose up -d --build
Write-Host "Containers started" -ForegroundColor Green

# ========== 4. WAIT FOR MONGODB ==========
Write-Host "`n[4/7] Waiting 60 seconds for MongoDB containers to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# ========== 5. INITIALIZE MONGODB CLUSTER ==========
Write-Host "`n[5/7] Initializing MongoDB Sharded Cluster..." -ForegroundColor Yellow

# Initialize Config Server Replica Set
Write-Host "  - Initializing Config Server Replica Set..." -ForegroundColor Cyan
docker exec config-server-1 mongosh --quiet --eval @"
rs.initiate({
  _id: 'configReplSet',
  configsvr: true,
  members: [
    { _id: 0, host: 'config-server-1:27017' },
    { _id: 1, host: 'config-server-2:27017' },
    { _id: 2, host: 'config-server-3:27017' }
  ]
})
"@
Write-Host "  Config Server Replica Set initialized" -ForegroundColor Green

Start-Sleep -Seconds 10

# Initialize Shard 1 (Hanoi)
Write-Host "  - Initializing Shard 1 (Hanoi)..." -ForegroundColor Cyan
docker exec shard1-primary mongosh --quiet --eval @"
rs.initiate({
  _id: 'rs-hanoi',
  members: [
    { _id: 0, host: 'shard1-primary:27017', priority: 2 },
    { _id: 1, host: 'shard1-secondary:27017', priority: 1 },
    { _id: 2, host: 'shard1-arbiter:27017', arbiterOnly: true }
  ]
})
"@
Write-Host "  Shard 1 (Hanoi) initialized" -ForegroundColor Green

# Initialize Shard 2 (Da Nang)
Write-Host "  - Initializing Shard 2 (Da Nang)..." -ForegroundColor Cyan
docker exec shard2-primary mongosh --quiet --eval @"
rs.initiate({
  _id: 'rs-danang',
  members: [
    { _id: 0, host: 'shard2-primary:27017', priority: 2 },
    { _id: 1, host: 'shard2-secondary:27017', priority: 1 },
    { _id: 2, host: 'shard2-arbiter:27017', arbiterOnly: true }
  ]
})
"@
Write-Host "  Shard 2 (Da Nang) initialized" -ForegroundColor Green

# Initialize Shard 3 (HCM)
Write-Host "  - Initializing Shard 3 (HCM)..." -ForegroundColor Cyan
docker exec shard3-primary mongosh --quiet --eval @"
rs.initiate({
  _id: 'rs-hcm',
  members: [
    { _id: 0, host: 'shard3-primary:27017', priority: 2 },
    { _id: 1, host: 'shard3-secondary:27017', priority: 1 },
    { _id: 2, host: 'shard3-arbiter:27017', arbiterOnly: true }
  ]
})
"@
Write-Host "  Shard 3 (HCM) initialized" -ForegroundColor Green

Start-Sleep -Seconds 15

# ========== 6. CONFIGURE SHARDING ==========
Write-Host "`n[6/7] Configuring Sharding..." -ForegroundColor Yellow

# Set default write concern
Write-Host "  - Setting default write concern..." -ForegroundColor Cyan
docker exec mongos-router mongosh --quiet --eval "db.adminCommand({setDefaultRWConcern: 1, defaultWriteConcern: {w: 'majority'}})"

# Add shards
Write-Host "  - Adding shards to cluster..." -ForegroundColor Cyan
docker exec mongos-router mongosh --quiet --eval "sh.addShard('rs-hanoi/shard1-primary:27017,shard1-secondary:27017')"
docker exec mongos-router mongosh --quiet --eval "sh.addShard('rs-danang/shard2-primary:27017,shard2-secondary:27017')"
docker exec mongos-router mongosh --quiet --eval "sh.addShard('rs-hcm/shard3-primary:27017,shard3-secondary:27017')"
Write-Host "  Shards added" -ForegroundColor Green

# Enable sharding and configure collections
Write-Host "  - Configuring database sharding..." -ForegroundColor Cyan
docker exec mongos-router mongosh --quiet --eval @"
sh.enableSharding('smartlearn');
db.getSiblingDB('smartlearn').users.createIndex({campus: 1});
db.getSiblingDB('smartlearn').courses.createIndex({campus: 1});
db.getSiblingDB('smartlearn').materials.createIndex({campus: 1, course_id: 1});
db.getSiblingDB('smartlearn').activities.createIndex({campus: 1, date: 1});
sh.shardCollection('smartlearn.users', {campus: 1});
sh.shardCollection('smartlearn.courses', {campus: 1});
sh.shardCollection('smartlearn.materials', {campus: 1, course_id: 1});
sh.shardCollection('smartlearn.activities', {campus: 1, date: 1});
"@
Write-Host "  Collections sharded" -ForegroundColor Green

# Configure zone sharding
Write-Host "  - Configuring zone sharding..." -ForegroundColor Cyan
docker exec mongos-router mongosh --quiet --eval @"
sh.addShardTag('rs-hanoi', 'HANOI');
sh.addShardTag('rs-danang', 'DANANG');
sh.addShardTag('rs-hcm', 'HCM');
sh.addTagRange('smartlearn.users', {campus: 'hanoi'}, {campus: 'hanoi\uffff'}, 'HANOI');
sh.addTagRange('smartlearn.users', {campus: 'danang'}, {campus: 'danang\uffff'}, 'DANANG');
sh.addTagRange('smartlearn.users', {campus: 'hcm'}, {campus: 'hcm\uffff'}, 'HCM');
sh.addTagRange('smartlearn.courses', {campus: 'hanoi'}, {campus: 'hanoi\uffff'}, 'HANOI');
sh.addTagRange('smartlearn.courses', {campus: 'danang'}, {campus: 'danang\uffff'}, 'DANANG');
sh.addTagRange('smartlearn.courses', {campus: 'hcm'}, {campus: 'hcm\uffff'}, 'HCM');
"@
Write-Host "  Zone sharding configured" -ForegroundColor Green

# ========== 7. VERIFY ==========
Write-Host "`n[7/7] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`nContainer Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}"

Write-Host "`nAPI Health Check:" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "API Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "API not ready yet. It may take a few more seconds..." -ForegroundColor Yellow
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "  - Web App: http://localhost"
Write-Host "  - API:     http://localhost:3001"
Write-Host "  - MongoDB: mongodb://localhost:27017"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  - View logs:     docker compose logs -f"
Write-Host "  - Stop all:      docker compose down"
Write-Host "  - Cluster status: docker exec mongos-router mongosh --eval 'sh.status()'"
