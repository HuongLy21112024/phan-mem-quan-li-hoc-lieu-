#!/bin/bash
# ============================================
# SmartLearn Deployment Script for AWS EC2
# Run this script on the EC2 server
# ============================================

set -e

echo "============================================"
echo "  SmartLearn Deployment Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========== 1. INSTALL DOCKER ==========
echo -e "\n${YELLOW}[1/6] Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# ========== 2. INSTALL DOCKER COMPOSE ==========
echo -e "\n${YELLOW}[2/6] Checking Docker Compose installation...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# ========== 3. START DOCKER CONTAINERS ==========
echo -e "\n${YELLOW}[3/6] Starting Docker containers...${NC}"
docker-compose up -d
echo -e "${GREEN}Containers started${NC}"

# ========== 4. WAIT FOR CONTAINERS TO BE READY ==========
echo -e "\n${YELLOW}[4/6] Waiting for MongoDB containers to be ready (60s)...${NC}"
sleep 60

# ========== 5. INITIALIZE MONGODB CLUSTER ==========
echo -e "\n${YELLOW}[5/6] Initializing MongoDB Sharded Cluster...${NC}"

# Initialize Config Server Replica Set
echo "Initializing Config Server Replica Set..."
docker exec -it config-server-1 mongosh --eval '
rs.initiate({
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "config-server-1:27017" },
    { _id: 1, host: "config-server-2:27017" },
    { _id: 2, host: "config-server-3:27017" }
  ]
})
'

sleep 10

# Initialize Shard 1 Replica Set (Hanoi)
echo "Initializing Shard 1 (Hanoi) Replica Set..."
docker exec -it shard1-primary mongosh --eval '
rs.initiate({
  _id: "rs-hanoi",
  members: [
    { _id: 0, host: "shard1-primary:27017", priority: 2 },
    { _id: 1, host: "shard1-secondary:27017", priority: 1 },
    { _id: 2, host: "shard1-arbiter:27017", arbiterOnly: true }
  ]
})
'

# Initialize Shard 2 Replica Set (Da Nang)
echo "Initializing Shard 2 (Da Nang) Replica Set..."
docker exec -it shard2-primary mongosh --eval '
rs.initiate({
  _id: "rs-danang",
  members: [
    { _id: 0, host: "shard2-primary:27017", priority: 2 },
    { _id: 1, host: "shard2-secondary:27017", priority: 1 },
    { _id: 2, host: "shard2-arbiter:27017", arbiterOnly: true }
  ]
})
'

# Initialize Shard 3 Replica Set (HCM)
echo "Initializing Shard 3 (HCM) Replica Set..."
docker exec -it shard3-primary mongosh --eval '
rs.initiate({
  _id: "rs-hcm",
  members: [
    { _id: 0, host: "shard3-primary:27017", priority: 2 },
    { _id: 1, host: "shard3-secondary:27017", priority: 1 },
    { _id: 2, host: "shard3-arbiter:27017", arbiterOnly: true }
  ]
})
'

sleep 15

# Add shards to cluster via mongos
echo "Adding shards to cluster..."
docker exec -it mongos-router mongosh --eval '
sh.addShard("rs-hanoi/shard1-primary:27017,shard1-secondary:27017");
sh.addShard("rs-danang/shard2-primary:27017,shard2-secondary:27017");
sh.addShard("rs-hcm/shard3-primary:27017,shard3-secondary:27017");
'

sleep 5

# Enable sharding and configure collections
echo "Configuring sharding for smartlearn database..."
docker exec -it mongos-router mongosh --eval '
sh.enableSharding("smartlearn");

// Create indexes before sharding
db.getSiblingDB("smartlearn").users.createIndex({ "campus": 1 });
db.getSiblingDB("smartlearn").courses.createIndex({ "campus": 1 });
db.getSiblingDB("smartlearn").materials.createIndex({ "campus": 1, "course_id": 1 });
db.getSiblingDB("smartlearn").activities.createIndex({ "campus": 1, "date": 1 });

// Shard collections
sh.shardCollection("smartlearn.users", { "campus": 1 });
sh.shardCollection("smartlearn.courses", { "campus": 1 });
sh.shardCollection("smartlearn.materials", { "campus": 1, "course_id": 1 });
sh.shardCollection("smartlearn.activities", { "campus": 1, "date": 1 });

// Configure zone sharding
sh.addShardTag("rs-hanoi", "HANOI");
sh.addShardTag("rs-danang", "DANANG");
sh.addShardTag("rs-hcm", "HCM");

sh.addTagRange("smartlearn.users", { campus: "hanoi" }, { campus: "hanoi\uffff" }, "HANOI");
sh.addTagRange("smartlearn.users", { campus: "danang" }, { campus: "danang\uffff" }, "DANANG");
sh.addTagRange("smartlearn.users", { campus: "hcm" }, { campus: "hcm\uffff" }, "HCM");

sh.addTagRange("smartlearn.courses", { campus: "hanoi" }, { campus: "hanoi\uffff" }, "HANOI");
sh.addTagRange("smartlearn.courses", { campus: "danang" }, { campus: "danang\uffff" }, "DANANG");
sh.addTagRange("smartlearn.courses", { campus: "hcm" }, { campus: "hcm\uffff" }, "HCM");

print("Sharding configuration completed!");
sh.status();
'

# ========== 6. VERIFY DEPLOYMENT ==========
echo -e "\n${YELLOW}[6/6] Verifying deployment...${NC}"

echo "Checking API health..."
sleep 5
API_HEALTH=$(curl -s http://localhost:3001/health || echo "API not ready")
echo "API Health: $API_HEALTH"

echo "Checking container status..."
docker ps

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Access your application:"
echo "  - Web App: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "  - Admin:   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/admin"
echo "  - API:     http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api"
echo ""
echo "MongoDB Cluster Status: docker exec -it mongos-router mongosh --eval 'sh.status()'"
echo "View logs: docker-compose logs -f"
