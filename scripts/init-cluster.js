// ========================================
// MongoDB Sharded Cluster Initialization Script
// Run this script after all containers are up
// ========================================

// Wait for services to be ready
print("Waiting for MongoDB services to initialize...");
sleep(5000);

// ========== 1. INITIALIZE CONFIG SERVER REPLICA SET ==========
print("\n========== Initializing Config Server Replica Set ==========");

// Connect to config-server-1 and initialize
var configRS = {
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "config-server-1:27017" },
    { _id: 1, host: "config-server-2:27017" },
    { _id: 2, host: "config-server-3:27017" }
  ]
};

try {
  rs.initiate(configRS);
  print("Config Replica Set initialized successfully");
} catch (e) {
  print("Config Replica Set already initialized or error: " + e);
}

// Wait for config replica set to elect primary
sleep(5000);

// ========== 2. INITIALIZE SHARD 1 REPLICA SET (HANOI) ==========
print("\n========== Initializing Shard 1 (Hanoi) Replica Set ==========");

var shard1RS = {
  _id: "rs-hanoi",
  members: [
    { _id: 0, host: "shard1-primary:27017", priority: 2 },
    { _id: 1, host: "shard1-secondary:27017", priority: 1 },
    { _id: 2, host: "shard1-arbiter:27017", arbiterOnly: true }
  ]
};

// ========== 3. INITIALIZE SHARD 2 REPLICA SET (DANANG) ==========
print("\n========== Initializing Shard 2 (Da Nang) Replica Set ==========");

var shard2RS = {
  _id: "rs-danang",
  members: [
    { _id: 0, host: "shard2-primary:27017", priority: 2 },
    { _id: 1, host: "shard2-secondary:27017", priority: 1 },
    { _id: 2, host: "shard2-arbiter:27017", arbiterOnly: true }
  ]
};

// ========== 4. INITIALIZE SHARD 3 REPLICA SET (HCM) ==========
print("\n========== Initializing Shard 3 (HCM) Replica Set ==========");

var shard3RS = {
  _id: "rs-hcm",
  members: [
    { _id: 0, host: "shard3-primary:27017", priority: 2 },
    { _id: 1, host: "shard3-secondary:27017", priority: 1 },
    { _id: 2, host: "shard3-arbiter:27017", arbiterOnly: true }
  ]
};

print("\nReplica Set configurations ready.");
print("Run the individual init scripts on each shard primary to initialize.");
