# TAI LIEU KY THUAT CHI TIET
## He thong Hoc lieu mo - SmartLearn
### Co so du lieu phan tan MongoDB

---

## MUC LUC

1. [Gioi thieu tong quan](#1-gioi-thieu-tong-quan)
2. [Thiet ke co so du lieu NoSQL](#2-thiet-ke-co-so-du-lieu-nosql)
3. [Kien truc he thong phan tan](#3-kien-truc-he-thong-phan-tan)
4. [Phat trien API/Web](#4-phat-trien-apiweb)
5. [Bao mat va phan quyen](#5-bao-mat-va-phan-quyen)
6. [Danh gia hieu nang](#6-danh-gia-hieu-nang)
7. [Rubric danh gia](#7-rubric-danh-gia)

---

## 1. GIOI THIEU TONG QUAN

### 1.1. Boi canh du an

Truong Dai hoc Su pham Ha Noi trien khai he thong **"Hoc lieu mo - SmartLearn"** nham ho tro giang vien va hoc vien truy cap, luu tru va chia se hoc lieu so tai nhieu co so dao tao:

| Co so | Vi tri | Vai tro trong he thong |
|-------|--------|------------------------|
| Co so 1 | Ha Noi | Node trung tam (Primary) |
| Co so 2 | Da Nang | Node chi nhanh (Secondary) |
| Co so 3 | TP.HCM | Node chi nhanh (Secondary) |

### 1.2. Muc tieu ky thuat

| STT | Muc tieu | Mo ta chi tiet |
|-----|----------|----------------|
| 1 | **Truy cap nhanh** | Do tre < 100ms cho cac truy van doc tu node gan nhat |
| 2 | **Dong bo du lieu** | Replication lag < 1 giay giua cac node |
| 3 | **High Availability** | Uptime 99.9%, tu dong failover khi node gap su co |
| 4 | **Thong ke real-time** | Dashboard cap nhat moi 5 giay |

### 1.3. Yeu cau kien thuc

Sinh vien can nam vung:

- **NoSQL Database**: Hieu ro su khac biet giua Document Store, Key-Value, Column-Family, Graph Database
- **Distributed Systems**: Phan manh (Sharding), Sao chep (Replication), Can bang tai (Load Balancing)
- **Dinh ly CAP**: Consistency, Availability, Partition Tolerance - va cach MongoDB xu ly trade-off


---

## 2. THIET KE CO SO DU LIEU NoSQL

### 2.1. Mo hinh du lieu (Data Model)

#### 2.1.1. Collection: users

```javascript
{
  "_id": ObjectId("..."),
  "user_id": "USR001",
  "email": "nguyenvana@hnue.edu.vn",
  "password_hash": "$2b$12$...",  // bcrypt hash
  "full_name": "Nguyen Van A",
  "role": "lecturer",  // "admin" | "lecturer" | "student"
  "campus": "hanoi",   // "hanoi" | "danang" | "hcm"
  "department": "Cong nghe thong tin",
  "avatar_url": "/uploads/avatars/usr001.jpg",
  "created_at": ISODate("2024-01-15T08:00:00Z"),
  "updated_at": ISODate("2024-01-15T08:00:00Z"),
  "last_login": ISODate("2024-12-01T10:30:00Z"),
  "status": "active",  // "active" | "inactive" | "suspended"
  "preferences": {
    "language": "vi",
    "notifications": true,
    "theme": "light"
  }
}
```

**Indexes:**
```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "campus": 1, "role": 1 })
db.users.createIndex({ "department": 1 })
```

#### 2.1.2. Collection: courses

```javascript
{
  "_id": ObjectId("..."),
  "course_id": "CRS001",
  "course_code": "IT101",
  "title": "Nhap mon Lap trinh",
  "description": "Khoa hoc co ban ve lap trinh voi Python",
  "campus": "hanoi",
  "department": "Cong nghe thong tin",
  "instructor_id": "USR001",
  "instructor_name": "Nguyen Van A",  // Denormalized for fast read
  "semester": "2024-1",
  "credits": 3,
  "status": "active",
  "enrollment_count": 45,
  "tags": ["programming", "python", "beginner"],
  "created_at": ISODate("2024-08-01T00:00:00Z"),
  "updated_at": ISODate("2024-09-15T10:00:00Z"),
  "metadata": {
    "syllabus_url": "/docs/syllabus/it101.pdf",
    "max_students": 60,
    "schedule": "T2-T4 7:00-9:00"
  }
}
```

**Indexes:**
```javascript
db.courses.createIndex({ "course_code": 1 }, { unique: true })
db.courses.createIndex({ "campus": 1, "department": 1 })
db.courses.createIndex({ "instructor_id": 1 })
db.courses.createIndex({ "tags": 1 })
db.courses.createIndex({ "title": "text", "description": "text" })  // Text search
```

#### 2.1.3. Collection: materials

```javascript
{
  "_id": ObjectId("..."),
  "material_id": "MAT001",
  "title": "Bai giang Chuong 1: Gioi thieu Python",
  "description": "Slide bai giang tuan 1",
  "course_id": "CRS001",
  "course_code": "IT101",  // Denormalized
  "campus": "hanoi",       // Shard key
  "type": "slide",  // "slide" | "video" | "document" | "quiz" | "assignment"
  "file_info": {
    "filename": "chapter1_intro.pptx",
    "original_name": "Chuong1_GioiThieu.pptx",
    "mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "size_bytes": 2048576,
    "storage_path": "/storage/materials/2024/09/mat001.pptx",
    "checksum_md5": "d41d8cd98f00b204e9800998ecf8427e"
  },
  "uploader_id": "USR001",
  "uploader_name": "Nguyen Van A",
  "visibility": "course",  // "public" | "course" | "private"
  "download_count": 128,
  "view_count": 256,
  "rating": {
    "average": 4.5,
    "count": 20
  },
  "tags": ["python", "introduction", "week1"],
  "created_at": ISODate("2024-09-01T08:00:00Z"),
  "updated_at": ISODate("2024-09-01T08:00:00Z"),
  "is_deleted": false
}
```

**Indexes:**
```javascript
db.materials.createIndex({ "course_id": 1, "type": 1 })
db.materials.createIndex({ "campus": 1 })  // Shard key index
db.materials.createIndex({ "uploader_id": 1 })
db.materials.createIndex({ "tags": 1 })
db.materials.createIndex({ "created_at": -1 })
db.materials.createIndex({ "title": "text", "description": "text" })
```

#### 2.1.4. Collection: activities

```javascript
{
  "_id": ObjectId("..."),
  "activity_id": "ACT001",
  "user_id": "USR002",
  "user_name": "Tran Thi B",  // Denormalized
  "campus": "hanoi",
  "action": "download",  // "view" | "download" | "upload" | "edit" | "delete" | "login" | "search"
  "target_type": "material",  // "material" | "course" | "user"
  "target_id": "MAT001",
  "target_title": "Bai giang Chuong 1",  // Denormalized
  "metadata": {
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "device_type": "desktop",
    "browser": "Chrome",
    "os": "Windows 10",
    "session_id": "sess_abc123",
    "duration_seconds": 300,
    "search_query": null,
    "file_size_bytes": 2048576
  },
  "timestamp": ISODate("2024-12-01T10:30:45Z"),
  "date": "2024-12-01",  // Partition key for time-series queries
  "hour": 10
}
```

**Indexes:**
```javascript
db.activities.createIndex({ "timestamp": -1 })
db.activities.createIndex({ "user_id": 1, "timestamp": -1 })
db.activities.createIndex({ "target_id": 1, "action": 1 })
db.activities.createIndex({ "campus": 1, "date": 1 })
db.activities.createIndex({ "action": 1, "date": 1 })
// TTL index de tu dong xoa log cu sau 1 nam
db.activities.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 31536000 })
```

### 2.2. Moi quan he giua cac Collection

```
+------------------------------------------------------------------+
|                     QUAN HE DU LIEU                               |
+------------------------------------------------------------------+
|                                                                   |
|   +----------+         1:N         +----------+                   |
|   |  users   |<--------------------|  courses |                   |
|   |          |    (instructor)     |          |                   |
|   +----+-----+                     +----+-----+                   |
|        |                                |                         |
|        | 1:N                            | 1:N                     |
|        | (uploader)                     | (belongs to)            |
|        v                                v                         |
|   +----------+         N:1         +----------+                   |
|   |materials |<--------------------|materials |                   |
|   |          |    (same course)    |          |                   |
|   +----+-----+                     +----------+                   |
|        |                                                          |
|        | 1:N                                                      |
|        | (target)                                                 |
|        v                                                          |
|   +----------+                                                    |
|   |activities|<------------ users (1:N - actor)                   |
|   |  (logs)  |                                                    |
|   +----------+                                                    |
|                                                                   |
+------------------------------------------------------------------+
```

### 2.3. Chien luoc Sharding

#### Shard Key Selection

| Collection | Shard Key | Ly do lua chon |
|------------|-----------|----------------|
| users | campus | Phan tan theo vi tri dia ly, queries thuong filter theo campus |
| courses | campus | Tuong tu users, courses thuoc ve tung co so |
| materials | { campus: 1, course_id: 1 } | Compound key de balance data va ho tro queries theo course |
| activities | { campus: 1, date: 1 } | Time-series data, queries thuong filter theo ngay va campus |

#### Cau hinh Sharding

```javascript
// Enable sharding cho database
sh.enableSharding("smartlearn")

// Shard collection users
sh.shardCollection("smartlearn.users", { "campus": 1 })

// Shard collection courses
sh.shardCollection("smartlearn.courses", { "campus": 1 })

// Shard collection materials (compound key)
sh.shardCollection("smartlearn.materials", { "campus": 1, "course_id": 1 })

// Shard collection activities (time-series)
sh.shardCollection("smartlearn.activities", { "campus": 1, "date": 1 })
```

### 2.4. Yeu cau Dataset mau

| Collection | So luong toi thieu | Phan bo |
|------------|-------------------|---------|
| users | 200 ban ghi | 100 HN, 50 DN, 50 HCM |
| courses | 50 ban ghi | 25 HN, 15 DN, 10 HCM |
| materials | 300 ban ghi | Phan bo deu theo courses |
| activities | 500 ban ghi | Du lieu 30 ngay gan nhat |

**Tong: >= 1000 ban ghi**


---

## 3. KIEN TRUC HE THONG PHAN TAN

### 3.1. So do kien truc tong quan

```
+---------------------------------------------------------------------------------+
|                          SMARTLEARN DISTRIBUTED ARCHITECTURE                     |
+---------------------------------------------------------------------------------+
|                                                                                  |
|                              +------------------+                                |
|                              |   LOAD BALANCER  |                                |
|                              |  (Nginx/HAProxy) |                                |
|                              +--------+---------+                                |
|                                       |                                          |
|          +----------------------------+----------------------------+             |
|          |                            |                            |             |
|          v                            v                            v             |
|   +--------------+            +--------------+            +--------------+       |
|   |  API Server  |            |  API Server  |            |  API Server  |       |
|   |   (HN-01)    |            |   (DN-01)    |            |  (HCM-01)    |       |
|   |  Port: 3001  |            |  Port: 3002  |            |  Port: 3003  |       |
|   +------+-------+            +------+-------+            +------+-------+       |
|          |                            |                            |             |
|          +----------------------------+----------------------------+             |
|                                       |                                          |
|                              +--------+--------+                                 |
|                              |  MONGOS ROUTER  |                                 |
|                              | (Query Router)  |                                 |
|                              +--------+--------+                                 |
|                                       |                                          |
|          +----------------------------+----------------------------+             |
|          |                            |                            |             |
|          v                            v                            v             |
|   +--------------+            +--------------+            +--------------+       |
|   |   CONFIG     |            |   CONFIG     |            |   CONFIG     |       |
|   |  SERVER 1    |            |  SERVER 2    |            |  SERVER 3    |       |
|   |  (Metadata)  |            |  (Metadata)  |            |  (Metadata)  |       |
|   +--------------+            +--------------+            +--------------+       |
|                                                                                  |
+---------------------------------------------------------------------------------+
|                              SHARD CLUSTERS                                      |
+---------------------------------------------------------------------------------+
|                                                                                  |
|   +------------------------+  +------------------------+  +------------------------+
|   |    SHARD 1 (HANOI)     |  |   SHARD 2 (DANANG)     |  |    SHARD 3 (HCM)       |
|   |   Replica Set: rs-hn   |  |   Replica Set: rs-dn   |  |   Replica Set: rs-hcm  |
|   |                        |  |                        |  |                        |
|   |  +-----+  +-----+      |  |  +-----+  +-----+      |  |  +-----+  +-----+      |
|   |  |  P  |  |  S  |      |  |  |  P  |  |  S  |      |  |  |  P  |  |  S  |      |
|   |  |27017|  |27018|      |  |  |27019|  |27020|      |  |  |27021|  |27022|      |
|   |  +--+--+  +--+--+      |  |  +--+--+  +--+--+      |  |  +--+--+  +--+--+      |
|   |     |       |         |  |     |       |         |  |     |       |         |
|   |     +---+---+         |  |     +---+---+         |  |     +---+---+         |
|   |         |             |  |         |             |  |         |             |
|   |     +---+---+         |  |     +---+---+         |  |     +---+---+         |
|   |     |Arbiter|         |  |     |Arbiter|         |  |     |Arbiter|         |
|   |     | 27023 |         |  |     | 27024 |         |  |     | 27025 |         |
|   |     +-------+         |  |     +-------+         |  |     +-------+         |
|   |                        |  |                        |  |                        |
|   | Data: campus="hanoi"   |  | Data: campus="danang"  |  |  Data: campus="hcm"   |
|   +------------------------+  +------------------------+  +------------------------+
|                                                                                  |
|   P = Primary    S = Secondary    Arbiter = Vote only (no data)                  |
|                                                                                  |
+---------------------------------------------------------------------------------+
```

### 3.2. Chi tiet cau hinh Docker

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # ========== CONFIG SERVERS ==========
  config-server-1:
    image: mongo:7.0
    container_name: config-server-1
    command: mongod --configsvr --replSet configReplSet --port 27017 --bind_ip_all
    volumes:
      - config1-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27101:27017"

  config-server-2:
    image: mongo:7.0
    container_name: config-server-2
    command: mongod --configsvr --replSet configReplSet --port 27017 --bind_ip_all
    volumes:
      - config2-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27102:27017"

  config-server-3:
    image: mongo:7.0
    container_name: config-server-3
    command: mongod --configsvr --replSet configReplSet --port 27017 --bind_ip_all
    volumes:
      - config3-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27103:27017"

  # ========== SHARD 1 - HANOI ==========
  shard1-primary:
    image: mongo:7.0
    container_name: shard1-primary
    command: mongod --shardsvr --replSet rs-hanoi --port 27017 --bind_ip_all
    volumes:
      - shard1-primary-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27201:27017"

  shard1-secondary:
    image: mongo:7.0
    container_name: shard1-secondary
    command: mongod --shardsvr --replSet rs-hanoi --port 27017 --bind_ip_all
    volumes:
      - shard1-secondary-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27202:27017"

  shard1-arbiter:
    image: mongo:7.0
    container_name: shard1-arbiter
    command: mongod --shardsvr --replSet rs-hanoi --port 27017 --bind_ip_all
    volumes:
      - shard1-arbiter-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27203:27017"

  # ========== SHARD 2 - DANANG ==========
  shard2-primary:
    image: mongo:7.0
    container_name: shard2-primary
    command: mongod --shardsvr --replSet rs-danang --port 27017 --bind_ip_all
    volumes:
      - shard2-primary-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27301:27017"

  shard2-secondary:
    image: mongo:7.0
    container_name: shard2-secondary
    command: mongod --shardsvr --replSet rs-danang --port 27017 --bind_ip_all
    volumes:
      - shard2-secondary-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27302:27017"

  shard2-arbiter:
    image: mongo:7.0
    container_name: shard2-arbiter
    command: mongod --shardsvr --replSet rs-danang --port 27017 --bind_ip_all
    volumes:
      - shard2-arbiter-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27303:27017"

  # ========== SHARD 3 - HCM ==========
  shard3-primary:
    image: mongo:7.0
    container_name: shard3-primary
    command: mongod --shardsvr --replSet rs-hcm --port 27017 --bind_ip_all
    volumes:
      - shard3-primary-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27401:27017"

  shard3-secondary:
    image: mongo:7.0
    container_name: shard3-secondary
    command: mongod --shardsvr --replSet rs-hcm --port 27017 --bind_ip_all
    volumes:
      - shard3-secondary-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27402:27017"

  shard3-arbiter:
    image: mongo:7.0
    container_name: shard3-arbiter
    command: mongod --shardsvr --replSet rs-hcm --port 27017 --bind_ip_all
    volumes:
      - shard3-arbiter-data:/data/db
    networks:
      - smartlearn-network
    ports:
      - "27403:27017"

  # ========== MONGOS ROUTER ==========
  mongos-router:
    image: mongo:7.0
    container_name: mongos-router
    command: mongos --configdb configReplSet/config-server-1:27017,config-server-2:27017,config-server-3:27017 --bind_ip_all --port 27017
    depends_on:
      - config-server-1
      - config-server-2
      - config-server-3
    networks:
      - smartlearn-network
    ports:
      - "27017:27017"

  # ========== API SERVER ==========
  api-server:
    build: ./api
    container_name: smartlearn-api
    environment:
      - MONGODB_URI=mongodb://mongos-router:27017/smartlearn
      - JWT_SECRET=your-super-secret-key-change-in-production
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      - mongos-router
    networks:
      - smartlearn-network
    ports:
      - "3000:3000"

volumes:
  config1-data:
  config2-data:
  config3-data:
  shard1-primary-data:
  shard1-secondary-data:
  shard1-arbiter-data:
  shard2-primary-data:
  shard2-secondary-data:
  shard2-arbiter-data:
  shard3-primary-data:
  shard3-secondary-data:
  shard3-arbiter-data:

networks:
  smartlearn-network:
    driver: bridge
```


### 3.3. Script khoi tao Replica Set va Sharding

#### init-cluster.js

```javascript
// ========== KHOI TAO CONFIG SERVER REPLICA SET ==========
// Chay tren config-server-1
rs.initiate({
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "config-server-1:27017" },
    { _id: 1, host: "config-server-2:27017" },
    { _id: 2, host: "config-server-3:27017" }
  ]
});

// ========== KHOI TAO SHARD 1 REPLICA SET (HANOI) ==========
// Chay tren shard1-primary
rs.initiate({
  _id: "rs-hanoi",
  members: [
    { _id: 0, host: "shard1-primary:27017", priority: 2 },
    { _id: 1, host: "shard1-secondary:27017", priority: 1 },
    { _id: 2, host: "shard1-arbiter:27017", arbiterOnly: true }
  ]
});

// ========== KHOI TAO SHARD 2 REPLICA SET (DANANG) ==========
// Chay tren shard2-primary
rs.initiate({
  _id: "rs-danang",
  members: [
    { _id: 0, host: "shard2-primary:27017", priority: 2 },
    { _id: 1, host: "shard2-secondary:27017", priority: 1 },
    { _id: 2, host: "shard2-arbiter:27017", arbiterOnly: true }
  ]
});

// ========== KHOI TAO SHARD 3 REPLICA SET (HCM) ==========
// Chay tren shard3-primary
rs.initiate({
  _id: "rs-hcm",
  members: [
    { _id: 0, host: "shard3-primary:27017", priority: 2 },
    { _id: 1, host: "shard3-secondary:27017", priority: 1 },
    { _id: 2, host: "shard3-arbiter:27017", arbiterOnly: true }
  ]
});

// ========== THEM SHARDS VAO CLUSTER (chay tren mongos) ==========
sh.addShard("rs-hanoi/shard1-primary:27017,shard1-secondary:27017");
sh.addShard("rs-danang/shard2-primary:27017,shard2-secondary:27017");
sh.addShard("rs-hcm/shard3-primary:27017,shard3-secondary:27017");

// ========== ENABLE SHARDING VA CAU HINH COLLECTIONS ==========
sh.enableSharding("smartlearn");

// Tao indexes truoc khi shard
db.users.createIndex({ "campus": 1 });
db.courses.createIndex({ "campus": 1 });
db.materials.createIndex({ "campus": 1, "course_id": 1 });
db.activities.createIndex({ "campus": 1, "date": 1 });

// Shard cac collections
sh.shardCollection("smartlearn.users", { "campus": 1 });
sh.shardCollection("smartlearn.courses", { "campus": 1 });
sh.shardCollection("smartlearn.materials", { "campus": 1, "course_id": 1 });
sh.shardCollection("smartlearn.activities", { "campus": 1, "date": 1 });

// ========== CAU HINH ZONE SHARDING ==========
// Dam bao du lieu cua moi campus nam tren shard tuong ung

// Zone cho Hanoi
sh.addShardTag("rs-hanoi", "HANOI");
sh.addTagRange("smartlearn.users", { campus: "hanoi" }, { campus: "hanoi\uffff" }, "HANOI");
sh.addTagRange("smartlearn.courses", { campus: "hanoi" }, { campus: "hanoi\uffff" }, "HANOI");

// Zone cho Danang
sh.addShardTag("rs-danang", "DANANG");
sh.addTagRange("smartlearn.users", { campus: "danang" }, { campus: "danang\uffff" }, "DANANG");
sh.addTagRange("smartlearn.courses", { campus: "danang" }, { campus: "danang\uffff" }, "DANANG");

// Zone cho HCM
sh.addShardTag("rs-hcm", "HCM");
sh.addTagRange("smartlearn.users", { campus: "hcm" }, { campus: "hcm\uffff" }, "HCM");
sh.addTagRange("smartlearn.courses", { campus: "hcm" }, { campus: "hcm\uffff" }, "HCM");
```

### 3.4. Kiem tra Failover

#### Kich ban test failover

```bash
# 1. Kiem tra trang thai replica set
docker exec -it shard1-primary mongosh --eval "rs.status()"

# 2. Dung primary node cua shard1
docker stop shard1-primary

# 3. Kiem tra election - secondary se tro thanh primary
docker exec -it shard1-secondary mongosh --eval "rs.status()"

# 4. Test truy van van hoat dong
docker exec -it mongos-router mongosh --eval "db.users.find({campus: 'hanoi'}).limit(5)"

# 5. Khoi phuc primary
docker start shard1-primary

# 6. Kiem tra lai trang thai (node cu se tro thanh secondary)
docker exec -it shard1-primary mongosh --eval "rs.status()"
```


---

## 4. PHAT TRIEN API/WEB

### 4.1. Kien truc API

```
+------------------------------------------------------------------+
|                      API ARCHITECTURE                             |
+------------------------------------------------------------------+
|                                                                   |
|   Client Request                                                  |
|        |                                                          |
|        v                                                          |
|   +------------------+                                            |
|   |   Middleware     |  - CORS                                    |
|   |     Stack        |  - Rate Limiting                           |
|   |                  |  - Request Logging                         |
|   |                  |  - Body Parser                             |
|   +--------+---------+                                            |
|            |                                                      |
|            v                                                      |
|   +------------------+                                            |
|   | Auth Middleware  |  - JWT Verification                        |
|   |                  |  - Role-based Access Control               |
|   +--------+---------+                                            |
|            |                                                      |
|            v                                                      |
|   +------------------------------------------------------+        |
|   |                    ROUTES                             |        |
|   +------------------------------------------------------+        |
|   |  /api/auth      |  Login, Register, Refresh Token    |        |
|   |  /api/users     |  CRUD Users (Admin only)           |        |
|   |  /api/courses   |  CRUD Courses                      |        |
|   |  /api/materials |  CRUD Materials, Upload/Download   |        |
|   |  /api/activities|  Activity Logs, Statistics         |        |
|   |  /api/stats     |  Dashboard Statistics              |        |
|   +--------+-----------------------------------------+            |
|            |                                                      |
|            v                                                      |
|   +------------------+                                            |
|   |   Controllers    |  - Business Logic                         |
|   |                  |  - Input Validation                        |
|   |                  |  - Error Handling                          |
|   +--------+---------+                                            |
|            |                                                      |
|            v                                                      |
|   +------------------+                                            |
|   |    Services      |  - Database Operations                     |
|   |                  |  - Aggregation Pipelines                   |
|   |                  |  - Caching Layer                           |
|   +--------+---------+                                            |
|            |                                                      |
|            v                                                      |
|   +------------------+                                            |
|   |  MongoDB Driver  |  - Connection Pool                         |
|   |   (mongoose)     |  - Read Preference                         |
|   |                  |  - Write Concern                           |
|   +------------------+                                            |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.2. Danh sach API Endpoints

#### 4.2.1. Authentication APIs

| Method | Endpoint | Mo ta | Role |
|--------|----------|-------|------|
| POST | /api/auth/register | Dang ky tai khoan moi | Public |
| POST | /api/auth/login | Dang nhap, tra ve JWT | Public |
| POST | /api/auth/refresh | Lam moi access token | Authenticated |
| POST | /api/auth/logout | Dang xuat | Authenticated |
| GET | /api/auth/me | Lay thong tin user hien tai | Authenticated |
| PUT | /api/auth/change-password | Doi mat khau | Authenticated |

#### 4.2.2. User Management APIs

| Method | Endpoint | Mo ta | Role |
|--------|----------|-------|------|
| GET | /api/users | Danh sach users (phan trang) | Admin |
| GET | /api/users/:id | Chi tiet user | Admin |
| POST | /api/users | Tao user moi | Admin |
| PUT | /api/users/:id | Cap nhat user | Admin |
| DELETE | /api/users/:id | Xoa user (soft delete) | Admin |
| GET | /api/users/search | Tim kiem user | Admin |

#### 4.2.3. Course Management APIs

| Method | Endpoint | Mo ta | Role |
|--------|----------|-------|------|
| GET | /api/courses | Danh sach khoa hoc | All |
| GET | /api/courses/:id | Chi tiet khoa hoc | All |
| POST | /api/courses | Tao khoa hoc moi | Admin, Lecturer |
| PUT | /api/courses/:id | Cap nhat khoa hoc | Admin, Lecturer (owner) |
| DELETE | /api/courses/:id | Xoa khoa hoc | Admin |
| GET | /api/courses/:id/materials | Hoc lieu cua khoa hoc | All |
| GET | /api/courses/search | Tim kiem khoa hoc | All |

#### 4.2.4. Material Management APIs

| Method | Endpoint | Mo ta | Role |
|--------|----------|-------|------|
| GET | /api/materials | Danh sach hoc lieu | All |
| GET | /api/materials/:id | Chi tiet hoc lieu | All |
| POST | /api/materials | Upload hoc lieu moi | Admin, Lecturer |
| PUT | /api/materials/:id | Cap nhat metadata | Admin, Lecturer (owner) |
| DELETE | /api/materials/:id | Xoa hoc lieu | Admin, Lecturer (owner) |
| GET | /api/materials/:id/download | Tai hoc lieu | All |
| POST | /api/materials/:id/rate | Danh gia hoc lieu | Student, Lecturer |
| GET | /api/materials/search | Tim kiem hoc lieu | All |

#### 4.2.5. Activity & Statistics APIs

| Method | Endpoint | Mo ta | Role |
|--------|----------|-------|------|
| GET | /api/activities | Lich su hoat dong | Admin |
| GET | /api/activities/user/:userId | Hoat dong cua user | Admin, Self |
| GET | /api/stats/overview | Thong ke tong quan | Admin |
| GET | /api/stats/materials | Thong ke hoc lieu | Admin, Lecturer |
| GET | /api/stats/users | Thong ke nguoi dung | Admin |
| GET | /api/stats/daily | Thong ke theo ngay | Admin |
| GET | /api/stats/campus/:campus | Thong ke theo campus | Admin |


### 4.3. Cac truy van mau

#### 4.3.1. Insert Operations

```javascript
// Insert user moi
db.users.insertOne({
  user_id: "USR" + Date.now(),
  email: "newuser@hnue.edu.vn",
  password_hash: "$2b$12$hashedpassword...",
  full_name: "Nguoi dung moi",
  role: "student",
  campus: "hanoi",
  department: "Cong nghe thong tin",
  created_at: new Date(),
  updated_at: new Date(),
  status: "active"
});

// Insert nhieu materials
db.materials.insertMany([
  {
    material_id: "MAT" + Date.now() + "_1",
    title: "Bai giang 1",
    course_id: "CRS001",
    campus: "hanoi",
    type: "slide"
  },
  {
    material_id: "MAT" + Date.now() + "_2",
    title: "Bai giang 2",
    course_id: "CRS001",
    campus: "hanoi",
    type: "video"
  }
]);
```

#### 4.3.2. Update Operations

```javascript
// Update mot document
db.materials.updateOne(
  { material_id: "MAT001" },
  {
    $set: {
      title: "Bai giang Chuong 1 (Cap nhat)",
      updated_at: new Date()
    },
    $inc: { view_count: 1 }
  }
);

// Update nhieu documents
db.users.updateMany(
  { campus: "hanoi", status: "inactive" },
  {
    $set: { status: "active", updated_at: new Date() }
  }
);

// Upsert - insert neu khong ton tai
db.activities.updateOne(
  { user_id: "USR001", date: "2024-12-01", action: "login" },
  {
    $setOnInsert: {
      activity_id: "ACT" + Date.now(),
      timestamp: new Date()
    },
    $inc: { count: 1 }
  },
  { upsert: true }
);
```

#### 4.3.3. Aggregation Pipelines

```javascript
// Thong ke so luot tai theo ngay (7 ngay gan nhat)
db.activities.aggregate([
  {
    $match: {
      action: "download",
      timestamp: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
      total_downloads: { $sum: 1 },
      unique_users: { $addToSet: "$user_id" }
    }
  },
  {
    $project: {
      date: "$_id",
      total_downloads: 1,
      unique_users: { $size: "$unique_users" }
    }
  },
  { $sort: { date: 1 } }
]);

// Top 10 hoc lieu duoc tai nhieu nhat
db.materials.aggregate([
  { $match: { is_deleted: { $ne: true } } },
  {
    $project: {
      material_id: 1,
      title: 1,
      course_code: 1,
      download_count: 1,
      view_count: 1,
      engagement_score: {
        $add: [
          "$download_count",
          { $multiply: ["$view_count", 0.1] }
        ]
      }
    }
  },
  { $sort: { engagement_score: -1 } },
  { $limit: 10 }
]);

// Thong ke hoat dong theo campus va loai hanh dong
db.activities.aggregate([
  {
    $match: {
      timestamp: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: { campus: "$campus", action: "$action" },
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: "$_id.campus",
      actions: {
        $push: {
          action: "$_id.action",
          count: "$count"
        }
      },
      total: { $sum: "$count" }
    }
  },
  { $sort: { total: -1 } }
]);

// Phan tich xu huong su dung theo gio trong ngay
db.activities.aggregate([
  {
    $match: {
      action: { $in: ["view", "download"] }
    }
  },
  {
    $group: {
      _id: { $hour: "$timestamp" },
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      hour: "$_id",
      count: 1,
      _id: 0
    }
  },
  { $sort: { hour: 1 } }
]);
```

#### 4.3.4. Map-Reduce (Legacy - su dung Aggregation thay the)

```javascript
// Map-Reduce: Dem hoc lieu theo department
db.materials.mapReduce(
  // Map function
  function() {
    emit(this.course_id, { count: 1, total_views: this.view_count });
  },
  // Reduce function
  function(key, values) {
    var result = { count: 0, total_views: 0 };
    values.forEach(function(value) {
      result.count += value.count;
      result.total_views += value.total_views;
    });
    return result;
  },
  {
    out: "material_stats_by_course",
    query: { is_deleted: { $ne: true } }
  }
);

// Tuong duong voi Aggregation Pipeline (khuyen nghi)
db.materials.aggregate([
  { $match: { is_deleted: { $ne: true } } },
  {
    $group: {
      _id: "$course_id",
      count: { $sum: 1 },
      total_views: { $sum: "$view_count" }
    }
  },
  { $out: "material_stats_by_course" }
]);
```

### 4.4. Cau truc ma nguon API (Node.js/Express)

```
smartlearn-api/
|-- src/
|   |-- config/
|   |   |-- database.js      # MongoDB connection config
|   |   |-- jwt.js           # JWT configuration
|   |   +-- constants.js     # App constants
|   |
|   |-- models/
|   |   |-- User.js
|   |   |-- Course.js
|   |   |-- Material.js
|   |   +-- Activity.js
|   |
|   |-- controllers/
|   |   |-- authController.js
|   |   |-- userController.js
|   |   |-- courseController.js
|   |   |-- materialController.js
|   |   |-- activityController.js
|   |   +-- statsController.js
|   |
|   |-- middlewares/
|   |   |-- auth.js          # JWT verification
|   |   |-- rbac.js          # Role-based access control
|   |   |-- rateLimiter.js   # Rate limiting
|   |   |-- validator.js     # Input validation
|   |   +-- errorHandler.js  # Global error handler
|   |
|   |-- routes/
|   |   |-- auth.routes.js
|   |   |-- user.routes.js
|   |   |-- course.routes.js
|   |   |-- material.routes.js
|   |   |-- activity.routes.js
|   |   |-- stats.routes.js
|   |   +-- index.js
|   |
|   |-- services/
|   |   |-- authService.js
|   |   |-- userService.js
|   |   |-- courseService.js
|   |   |-- materialService.js
|   |   |-- activityService.js
|   |   +-- statsService.js
|   |
|   |-- utils/
|   |   |-- logger.js
|   |   |-- helpers.js
|   |   +-- pagination.js
|   |
|   +-- app.js               # Express app entry point
|
|-- tests/
|   |-- unit/
|   +-- integration/
|
|-- scripts/
|   |-- seed-data.js         # Generate sample data
|   |-- init-cluster.js      # Initialize MongoDB cluster
|   +-- benchmark.js         # Performance testing
|
|-- Dockerfile
|-- docker-compose.yml
|-- package.json
+-- README.md
```


---

## 5. BAO MAT VA PHAN QUYEN

### 5.1. Ma hoa mat khau voi bcrypt

```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash password khi dang ky
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(plainPassword, salt);
  return hash;
}

// Verify password khi dang nhap
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

### 5.2. JWT Authentication

```javascript
const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d'
};

// Tao tokens
function generateTokens(user) {
  const payload = {
    userId: user.user_id,
    email: user.email,
    role: user.role,
    campus: user.campus
  };

  const accessToken = jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.accessTokenExpiry
  });

  const refreshToken = jwt.sign(
    { userId: user.user_id },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
}

// Middleware xac thuc
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 5.3. Role-Based Access Control (RBAC)

```javascript
const ROLES = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  STUDENT: 'student'
};

const PERMISSIONS = {
  // User management
  'users.create': [ROLES.ADMIN],
  'users.read': [ROLES.ADMIN],
  'users.update': [ROLES.ADMIN],
  'users.delete': [ROLES.ADMIN],

  // Course management
  'courses.create': [ROLES.ADMIN, ROLES.LECTURER],
  'courses.read': [ROLES.ADMIN, ROLES.LECTURER, ROLES.STUDENT],
  'courses.update': [ROLES.ADMIN, ROLES.LECTURER],
  'courses.delete': [ROLES.ADMIN],

  // Material management
  'materials.create': [ROLES.ADMIN, ROLES.LECTURER],
  'materials.read': [ROLES.ADMIN, ROLES.LECTURER, ROLES.STUDENT],
  'materials.update': [ROLES.ADMIN, ROLES.LECTURER],
  'materials.delete': [ROLES.ADMIN, ROLES.LECTURER],
  'materials.download': [ROLES.ADMIN, ROLES.LECTURER, ROLES.STUDENT],

  // Statistics
  'stats.view': [ROLES.ADMIN, ROLES.LECTURER],
  'stats.export': [ROLES.ADMIN]
};

// Middleware kiem tra quyen
function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.user.role;
    const allowedRoles = PERMISSIONS[permission] || [];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Permission ' + permission + ' required'
      });
    }
    next();
  };
}

// Kiem tra ownership (cho update/delete)
function requireOwnership(resourceType) {
  return async (req, res, next) => {
    const userId = req.user.userId;
    const resourceId = req.params.id;
    
    // Admin co the access tat ca
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Kiem tra ownership
    let resource;
    switch (resourceType) {
      case 'course':
        resource = await db.courses.findOne({ course_id: resourceId });
        if (resource && resource.instructor_id === userId) {
          return next();
        }
        break;
      case 'material':
        resource = await db.materials.findOne({ material_id: resourceId });
        if (resource && resource.uploader_id === userId) {
          return next();
        }
        break;
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  };
}
```

### 5.4. Bao ve khoi NoSQL Injection

```javascript
const mongoSanitize = require('express-mongo-sanitize');

// Sanitize input
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn('Sanitized key: ' + key + ' in request');
  }
}));

// Validate va sanitize query parameters
function sanitizeQuery(query) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Loai bo cac operator nguy hiem
    if (typeof value === 'object') {
      const dangerous = ['$where', '$regex', '$ne', '$nin'];
      for (const op of dangerous) {
        if (value[op] !== undefined) {
          delete value[op];
        }
      }
    }
    
    // Escape special characters
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

### 5.5. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes'
  }
});

// Strict rate limit cho login
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 failed attempts
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many login attempts',
    retryAfter: '1 hour'
  }
});

// Apply limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
```


---

## 6. DANH GIA HIEU NANG

### 6.1. Metrics can do luong

| Metric | Mo ta | Muc tieu |
|--------|-------|----------|
| **Latency** | Thoi gian phan hoi trung binh | < 100ms (read), < 200ms (write) |
| **Throughput** | So requests/giay | > 1000 req/s |
| **Replication Lag** | Do tre dong bo giua primary va secondary | < 1 giay |
| **Error Rate** | Ty le requests that bai | < 0.1% |
| **Connection Pool** | So connections active | < 80% max pool |

### 6.2. Script Benchmark

```javascript
// benchmark.js
const { MongoClient } = require('mongodb');
const { performance } = require('perf_hooks');

const MONGODB_URI = 'mongodb://localhost:27017/smartlearn';
const NUM_ITERATIONS = 1000;

async function runBenchmark() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('smartlearn');
  
  const results = {
    read: { times: [], errors: 0 },
    write: { times: [], errors: 0 },
    aggregate: { times: [], errors: 0 }
  };

  // Benchmark READ operations
  console.log('Benchmarking READ operations...');
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    const start = performance.now();
    try {
      await db.collection('users').find({ campus: 'hanoi' }).limit(10).toArray();
      results.read.times.push(performance.now() - start);
    } catch (e) {
      results.read.errors++;
    }
  }

  // Benchmark WRITE operations
  console.log('Benchmarking WRITE operations...');
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    const start = performance.now();
    try {
      await db.collection('activities').insertOne({
        activity_id: 'bench_' + Date.now() + '_' + i,
        user_id: 'USR001',
        action: 'benchmark',
        timestamp: new Date(),
        campus: 'hanoi'
      });
      results.write.times.push(performance.now() - start);
    } catch (e) {
      results.write.errors++;
    }
  }

  // Benchmark AGGREGATION operations
  console.log('Benchmarking AGGREGATION operations...');
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    try {
      await db.collection('activities').aggregate([
        { $match: { campus: 'hanoi' } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      results.aggregate.times.push(performance.now() - start);
    } catch (e) {
      results.aggregate.errors++;
    }
  }

  // Calculate statistics
  function calcStats(times) {
    const sorted = times.sort((a, b) => a - b);
    return {
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2),
      avg: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
      p50: sorted[Math.floor(sorted.length * 0.5)].toFixed(2),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
      p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2)
    };
  }

  console.log('\n========== BENCHMARK RESULTS ==========');
  console.log('\nREAD Operations (ms):');
  console.table(calcStats(results.read.times));
  console.log('Errors: ' + results.read.errors);

  console.log('\nWRITE Operations (ms):');
  console.table(calcStats(results.write.times));
  console.log('Errors: ' + results.write.errors);

  console.log('\nAGGREGATION Operations (ms):');
  console.table(calcStats(results.aggregate.times));
  console.log('Errors: ' + results.aggregate.errors);

  // Cleanup
  await db.collection('activities').deleteMany({ action: 'benchmark' });
  await client.close();
}

runBenchmark().catch(console.error);
```

### 6.3. Kiem tra Replication Lag

```javascript
// check-replication.js
async function checkReplicationLag() {
  // Ket noi toi primary
  const primary = await MongoClient.connect('mongodb://shard1-primary:27017');
  
  // Ket noi toi secondary
  const secondary = await MongoClient.connect('mongodb://shard1-secondary:27017', {
    readPreference: 'secondary'
  });

  // Insert document vao primary
  const testDoc = { _id: new ObjectId(), test: true, timestamp: new Date() };
  const insertTime = Date.now();
  await primary.db('smartlearn').collection('test_replication').insertOne(testDoc);

  // Poll secondary cho toi khi thay document
  let found = false;
  let replicationLag = 0;
  
  while (!found && replicationLag < 10000) {
    const doc = await secondary.db('smartlearn')
      .collection('test_replication')
      .findOne({ _id: testDoc._id });
    
    if (doc) {
      found = true;
      replicationLag = Date.now() - insertTime;
    } else {
      await new Promise(r => setTimeout(r, 10));
      replicationLag = Date.now() - insertTime;
    }
  }

  console.log('Replication lag: ' + replicationLag + 'ms');
  
  // Cleanup
  await primary.db('smartlearn').collection('test_replication').drop();
  await primary.close();
  await secondary.close();
}
```

### 6.4. Load Testing voi Artillery

```yaml
# artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 180
      arrivalRate: 100
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: "application/json"
  variables:
    campuses:
      - "hanoi"
      - "danang"
      - "hcm"

scenarios:
  - name: "Browse materials"
    weight: 50
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@hnue.edu.vn"
            password: "password123"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/api/courses"
          headers:
            Authorization: "Bearer {{ token }}"
      - get:
          url: "/api/materials"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Search and download"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@hnue.edu.vn"
            password: "password123"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/api/materials/search?q=python"
          headers:
            Authorization: "Bearer {{ token }}"
      - get:
          url: "/api/materials/MAT001/download"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Dashboard statistics"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "admin@hnue.edu.vn"
            password: "adminpass123"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/api/stats/overview"
          headers:
            Authorization: "Bearer {{ token }}"
      - get:
          url: "/api/stats/daily"
          headers:
            Authorization: "Bearer {{ token }}"
```

### 6.5. Bang danh gia hieu nang mau

| Test Case | Metric | Without Sharding | With Sharding | Improvement |
|-----------|--------|------------------|---------------|-------------|
| Read 1000 users | Avg latency | 45ms | 15ms | 67% |
| Read 1000 materials | Avg latency | 120ms | 35ms | 71% |
| Insert 1000 activities | Avg latency | 80ms | 25ms | 69% |
| Aggregation (30 days) | Avg latency | 2500ms | 800ms | 68% |
| Concurrent users (100) | Throughput | 450 req/s | 1200 req/s | 167% |
| Failover recovery | Downtime | N/A | 2.5s | - |


---

## 7. RUBRIC DANH GIA

### 7.1. Bang diem chi tiet

| STT | Tieu chi | Mo ta yeu cau | Diem toi da |
|-----|----------|---------------|-------------|
| **1** | **Thiet ke mo hinh CSDL NoSQL** | | **20 diem** |
| 1.1 | Mo hinh du lieu logic | Thiet ke collections voi cac fields phu hop | 5 |
| 1.2 | Mo hinh du lieu physical | Cau hinh indexes, shard keys hop ly | 5 |
| 1.3 | Moi quan he va denormalization | Embedding vs Referencing phu hop | 5 |
| 1.4 | Dataset mau | >= 500 ban ghi, da dang, realistic | 5 |
| **2** | **Trien khai he thong CSDL phan tan** | | **20 diem** |
| 2.1 | Cau hinh cluster | >= 3 nodes voi replica set | 5 |
| 2.2 | Replication | Dong bo du lieu tu dong, read preference | 5 |
| 2.3 | Sharding | Phan tan du lieu theo campus/region | 5 |
| 2.4 | Failover test | Minh chung recovery khi node down | 5 |
| **3** | **Xay dung API/Web ket noi NoSQL** | | **15 diem** |
| 3.1 | CRUD operations | >= 4 nhom chuc nang hoan chinh | 5 |
| 3.2 | API stability | Xu ly loi, validation, responses chuan | 4 |
| 3.3 | Aggregation | Statistics, reports voi aggregation pipeline | 3 |
| 3.4 | UI/Dashboard | Giao dien truc quan (neu co) | 3 |
| **4** | **Xu ly truy van nang cao** | | **15 diem** |
| 4.1 | Aggregation pipeline | Su dung dung cac stages | 5 |
| 4.2 | Indexing strategy | Toi uu queries voi indexes | 5 |
| 4.3 | Performance comparison | So sanh co/khong sharding | 5 |
| **5** | **Bao mat va phan quyen** | | **10 diem** |
| 5.1 | Authentication | JWT implementation dung chuan | 3 |
| 5.2 | Password hashing | bcrypt voi salt rounds phu hop | 2 |
| 5.3 | RBAC | Phan quyen theo role | 3 |
| 5.4 | Security measures | NoSQL injection, rate limiting | 2 |
| **6** | **Hieu nang & danh gia he thong** | | **10 diem** |
| 6.1 | Benchmark | Do latency, throughput | 4 |
| 6.2 | Replication lag | Do va bao cao | 3 |
| 6.3 | Analysis | Phan tich uu/nhuoc diem | 3 |
| **7** | **Bao cao cuoi ky** | | **5 diem** |
| 7.1 | Cau truc | Mach lac, day du sections | 2 |
| 7.2 | Noi dung | Screenshots, code samples, diagrams | 2 |
| 7.3 | Tu danh gia | Ket luan va huong phat trien | 1 |
| **8** | **Demo & van dap** | | **5 diem** |
| 8.1 | Demo | Chay muot, day du chuc nang | 3 |
| 8.2 | Q&A | Tra loi ro rang ve thiet ke, hieu nang | 2 |
| | **TONG DIEM** | | **100 diem** |

### 7.2. Thang diem chu

| Diem so | Xep loai | Mo ta |
|---------|----------|-------|
| 90-100 | A | Xuat sac - Vuot yeu cau |
| 80-89 | B+ | Gioi - Dap ung tot yeu cau |
| 70-79 | B | Kha - Dap ung yeu cau |
| 60-69 | C | Trung binh - Dap ung co ban |
| 50-59 | D | Yeu - Can cai thien nhieu |
| < 50 | F | Khong dat |

---

## 8. DANH MUC TAI LIEU THAM KHAO

1. MongoDB Documentation: https://docs.mongodb.com/
2. MongoDB University: https://university.mongodb.com/
3. Designing Data-Intensive Applications - Martin Kleppmann
4. NoSQL Distilled - Pramod J. Sadalage, Martin Fowler
5. Express.js Documentation: https://expressjs.com/
6. JWT.io: https://jwt.io/

---

## PHU LUC

### A. Checklist hoan thanh

- [ ] Thiet ke schema cho 4 collections
- [ ] Tao dataset mau (>= 500 ban ghi)
- [ ] Cau hinh Docker Compose
- [ ] Khoi tao Replica Sets
- [ ] Cau hinh Sharding
- [ ] Test Failover
- [ ] Phat trien API endpoints
- [ ] Implement Authentication (JWT)
- [ ] Implement Authorization (RBAC)
- [ ] Viet aggregation queries
- [ ] Benchmark hieu nang
- [ ] Tao Dashboard (optional)
- [ ] Viet bao cao PDF
- [ ] Chuan bi demo

### B. Cau truc thu muc nop bai

```
SmartLearn_[MaSV]/
|-- source/
|   |-- api/                 # Ma nguon API
|   |-- web/                 # Ma nguon Web (neu co)
|   +-- docker-compose.yml
|
|-- database/
|   |-- schema/              # Schema definitions
|   |-- seed/                # Sample data
|   +-- scripts/             # Init scripts
|
|-- docs/
|   |-- Bao_cao.pdf          # Bao cao 15-20 trang
|   |-- screenshots/         # Anh demo
|   +-- diagrams/            # So do kien truc
|
+-- README.md                # Huong dan cai dat
```

---

*Tai lieu cap nhat: Thang 01/2026*
*Phien ban: 2.0*
