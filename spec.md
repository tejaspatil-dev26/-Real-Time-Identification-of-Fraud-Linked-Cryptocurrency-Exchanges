# Technical Architecture Specification: Real-Time Crypto-Forensics & Fraud-Linked VASP Identification Platform

**Document Version:** 1.0.0

**Target Execution Agent:** Antigravity AI

**Paradigm:** Spec-Driven Development (SDD)

**Classification:** Technical System Specification

---

## 1. Product Overview & Core Functionality

### 1.1 Executive Summary

The platform is an automated, real-time cryptocurrency forensic intelligence engine designed to identify cash-out points at Virtual Asset Service Providers (VASPs) from victim-reported suspect wallet addresses. The platform transforms pseudonymous public blockchain transaction data into explainable, legally defensible forensic evidence chains.

```
+------------------+      +-------------------+      +---------------------+      +---------------------+
| Victim Complaint | ---> | Dynamic Subgraph  | ---> | GNN Entity          | ---> | Terminal VASP       |
| (Suspect Wallet) |      | Traversal (RPC)   |      | Clustering (PyG)    |      | Identification &    |
+------------------+      +-------------------+      +---------------------+      | ISO/IEC 27037 Audit |
                                                                                  +---------------------+

```

### 1.2 Core System Capabilities

* **Dynamic Multi-Hop Graph Traversal:** Ingests seed suspect addresses and reconstructs fund-flow topologies across upstream and downstream execution paths using directed graph traversal (BFS/DFS).
* **Automated Wallet Hopping Detection:** Subscribes to mempool events and WebSocket indexers to detect when threat actors abandon monitored wallets, dynamically expanding the active investigation graph frontier.
* **Topological Anomaly Detection:** Identifies behavioral laundering typologies, including peel chains, high-frequency fan-out splitting (smurfing), fan-in consolidation, and bipartite cyclic mixing.
* **Entity Resolution via Inductive GNNs:** Computes structural and behavioral graph embeddings using GraphSAGE to cluster disparate wallet addresses into deterministic "Probable Entity Clusters" with confidence intervals.
* **VASP Attribution & Reverse Flow Analysis:** Matches terminal fund destinations against known exchange deposit addresses and enables reverse fund-flow tracing from flagged exchange deposits back to malicious controllers.
* **ISO/IEC 27037:2012 Compliant Forensic Export:** Formats investigation graphs into cryptographically signed, immutable digital evidence packages with SHA-256 integrity verification.

---

## 2. Target User Roles & Security Profiles

The system enforces strict Role-Based Access Control (RBAC) via cryptographically verified claims:

| Role Identifier | Role Name | System Capabilities & Permissions |
| --- | --- | --- |
| `ROLE_INVESTIGATOR` | Law Enforcement & Cybercrime Investigator | Can initialize suspect wallet searches, create case files, trigger background graph queries, view topological graphs, and export ISO/IEC 27037 forensic packages. |
| `ROLE_ANALYST` | Compliance & Risk Intelligence Analyst | Can annotate graph nodes, enrich VASP registry metadata, modify risk thresholds, run reverse fund-flow analytics, and review entity resolution confidence scores. |
| `ROLE_ADMIN` | System Administrator | Full administrative control: user provisioning, role assignments, API rate-limiting rules, worker concurrency, and cryptographic key rotations. |

---

## 3. Technology Stack & Architectural Blueprint

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                 |
|   Next.js 14 (App Router, TypeScript) | Tailwind CSS | Cytoscape.js | Three.js / R3F   |
+-------------------------------------------+-------------------------------------------+
                                            | (HTTPS / SSE / WebSockets)
+-------------------------------------------v-------------------------------------------+
|                                    APPLICATION GATEWAY                                |
|   Python 3.11+ / FastAPI (ASGI) | Pydantic v2 Validation | JWT RS256 Auth Middleware   |
+---------------------+-------------------------------------+---------------------------+
                      |                                     |
+---------------------v-----------------+     +-------------v---------------------------+
|      DATA PERSISTENCE LAYER           |     |     DISTRIBUTED TASK & ML PIPELINE      |
|  * Relational: PostgreSQL 16          |     |  * Broker & Caching: Redis 7            |
|    (ORM: SQLAlchemy 2.0 / Alembic)    |     |  * Task Queue: Celery 5.3+              |
|  * Graph DBMS: Neo4j 5.x Enterprise   |     |  * GNN Engine: PyTorch Geometric (PyG)  |
|    (Graph Data Science Plugin 2.x)    |     |  * Explainability: SHAP (Tree/Deep)     |
+---------------------------------------+     +-----------------------------------------+

```

### 3.1 Frontend & Visualization

* **Core Framework:** Next.js 14 (React 18, App Router, TypeScript 5.x)
* **Styling & UI Kit:** Tailwind CSS 3.4, Shadcn/UI (Radix Primitives)
* **Motion & Micro-interactions:** Framer Motion 11
* **2D Network Topology:** Cytoscape.js with `cytoscape-dagre` and `cytoscape-fcose` layouts
* **3D Global Flow Visuals:** Three.js via `@react-three/fiber` and `@react-three/drei`

### 3.2 Backend Services

* **Application Framework:** Python 3.11+ using FastAPI (Asynchronous Server Gateway Interface)
* **Async Concurrency:** `asyncio`, `httpx` for external asynchronous RPC interactions
* **Data Validation:** Pydantic v2 data transfer schemas

### 3.3 Database Management Systems (DBMS)

* **Relational Storage:** PostgreSQL 16 (ACID-compliant storage for users, authentication, cases, evidence logs, audit trails)
* **Relational ORM:** SQLAlchemy 2.0 (Modern Async API) + Alembic for migrations
* **Graph Storage:** Neo4j 5.x (Native Graph Engine optimized for recursive multi-hop pathfinding)
* **Graph Engine:** Neo4j Graph Data Science (GDS) library for in-memory graph embeddings and path projection

### 3.4 Distributed Task Queue & Messaging

* **Message Broker & Task Result Store:** Redis 7 (In-Memory K/V, Redis Streams, Pub/Sub)
* **Task Queue:** Celery 5.3+ for long-running RPC indexing, topological expansion, and GNN inference

---

## 4. MVP Functional Scope

1. **Suspect Wallet Ingestion:** Single-input intake validating Bitcoin (`base58`, `bech32`) and Ethereum (`ERC-55`) addresses.
2. **Autonomous Graph Construction:** Recursive BFS/DFS tracing downstream transactions up to 6 hops or until a known VASP cluster is reached.
3. **Behavioral Pattern Flagging:** Rule engine identifying peel chains (1 high output + 1 micro-change output) and fan-out distribution structures.
4. **GraphSAGE Entity Clustering:** Node embeddings generated dynamically via PyG to group multi-wallet clusters controlled by a single entity.
5. **VASP Cash-Out Target Resolution:** Direct matching against an indexed table of known VASP deposit addresses, calculating estimated illicit value absorbed by each exchange.
6. **Real-Time Workspace Canvas:** Cytoscape.js interactive graph canvas with dynamic filtering by timestamp, transaction amount, and token type.
7. **Forensic Report Generation:** Export of an ISO/IEC 27037 compliant JSON/PDF report containing graph traversal lineage, controller candidate rankings, and an overall SHA-256 digital signature.

---

## 5. System Pages & Data Models

### 5.1 Frontend UI Routing Hierarchy

```
/
├── /login                         --> Authentication, MFA, and SSO verification
├── /dashboard                     --> Active investigation metrics, system alerts, recent cases
├── /investigation
│   ├── /new                       --> Intake form: seed wallet, blockchain network, depth limits
│   └── /[case_id]                 --> Active investigation split-view:
│       ├── /workspace             --> Full-screen Cytoscape/Three.js interactive canvas
│       ├── /entity-profiler       --> GNN clustering, controller scores, SHAP explanations
│       └── /audit-trail           --> Chain-of-custody logs and timestamped state history
├── /vasp-registry                 --> Searchable database of known VASPs, risk tiers, and legal contact info
└── /evidence/[case_id]/export     --> ISO/IEC 27037 export validation and cryptographic hash display

```

---

### 5.2 Relational Database Schema (PostgreSQL 16)

```sql
-- Extension enablement
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Enums
CREATE TYPE user_role_enum AS ENUM ('INVESTIGATOR', 'ANALYST', 'ADMIN');
CREATE TYPE case_status_enum AS ENUM ('ACTIVE', 'PENDING_ANALYSIS', 'CLOSED', 'ARCHIVED');
CREATE TYPE crypto_network_enum AS ENUM ('BITCOIN', 'ETHEREUM', 'POLYGON', 'TRON');
CREATE TYPE risk_level_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'BENIGN');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'INVESTIGATOR',
    agency_or_firm VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cases Table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status case_status_enum NOT NULL DEFAULT 'ACTIVE',
    primary_investigator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Target Suspect Seeds
CREATE TABLE suspect_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    address VARCHAR(128) NOT NULL,
    network crypto_network_enum NOT NULL,
    reported_victim_loss_usd NUMERIC(18, 2),
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_case_wallet UNIQUE (case_id, address, network)
);

-- Known VASPs
CREATE TABLE vasp_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vasp_name VARCHAR(150) UNIQUE NOT NULL,
    legal_entity_name VARCHAR(255),
    jurisdiction_code VARCHAR(3), -- ISO 3166-1 alpha-3
    risk_level risk_level_enum NOT NULL DEFAULT 'LOW',
    compliance_email VARCHAR(255),
    travel_rule_compliant BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Evidence Reports (ISO/IEC 27037:2012)
CREATE TABLE evidence_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    generated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sha256_hash CHAR(64) NOT NULL,
    s3_storage_uri VARCHAR(512) NOT NULL,
    report_metadata JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System Audit Trail (Chain-of-Custody)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    payload_snapshot JSONB,
    ip_address INET,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_cases_investigator ON cases(primary_investigator_id);
CREATE INDEX idx_suspect_wallets_address ON suspect_wallets(address);
CREATE INDEX idx_evidence_sha256 ON evidence_reports(sha256_hash);
CREATE INDEX idx_audit_logs_case ON audit_logs(case_id);

```

---

### 5.3 Graph Database Schema (Neo4j 5.x)

#### Node Labels and Properties

* `(:Wallet)`
* `address: STRING` (Unique Index)
* `network: STRING`
* `balance: FLOAT`
* `risk_score: FLOAT`
* `is_contract: BOOLEAN`
* `first_seen: DATETIME`
* `last_seen: DATETIME`


* `(:Transaction)`
* `tx_hash: STRING` (Unique Index)
* `network: STRING`
* `amount: FLOAT`
* `fee: FLOAT`
* `timestamp: DATETIME`
* `block_number: INTEGER`


* `(:Entity)`
* `entity_id: STRING` (UUID, Unique Index)
* `cluster_label: STRING`
* `confidence_score: FLOAT`
* `algorithm: STRING`


* `(:VASP)`
* `vasp_id: STRING` (UUID, Unique Index)
* `name: STRING`
* `jurisdiction: STRING`



#### Relationship Declarations

```cypher
// Schema Constraints
CREATE CONSTRAINT uq_wallet_address IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE;
CREATE CONSTRAINT uq_tx_hash IF NOT EXISTS FOR (t:Transaction) REQUIRE t.tx_hash IS UNIQUE;
CREATE CONSTRAINT uq_entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.entity_id IS UNIQUE;
CREATE CONSTRAINT uq_vasp_id IF NOT EXISTS FOR (v:VASP) REQUIRE v.vasp_id IS UNIQUE;

// Relationship Structure
(:Wallet)-[:SENT {amount: FLOAT, timestamp: DATETIME}]->(:Transaction)
(:Transaction)-[:RECEIVED_BY {amount: FLOAT, timestamp: DATETIME}]->(:Wallet)
(:Wallet)-[:BELONGS_TO {confidence: FLOAT, model_version: STRING}]->(:Entity)
(:Wallet)-[:HOSTED_BY {deposit_tag: STRING, verified: BOOLEAN}]->(:VASP)

```

---

## 6. Authentication & Asynchronous AI Execution Pipeline

```
[ Client ] 
    | 
    | 1. POST /api/v1/investigate { seed_wallet, max_depth }
    v
[ FastAPI Gateway ] 
    | 
    | 2. Push Background Task (UUID)
    +----------------------------------------> [ Redis Broker ]
    | 3. Returns 202 Accepted { task_id }           |
    v                                               | 4. Dequeue Task
[ Client Dashboard ]                                v
    |                                    [ Celery Task Worker ]
    |                                               |
    |                                               | 5. Stream Real-Time Hop Data
    |                                               +-----------------------------> [ Neo4j Graph DB ]
    |                                               |
    |                                               | 6. Extract Subgraph Tensors
    |                                               v
    |                                    [ PyG GraphSAGE Inference ]
    |                                               |
    |                                               | 7. Write Entity Predictions
    |                                               +-----------------------------> [ Neo4j Graph DB ]
    |                                               |
    | 8. SSE Progress Channel (/events/{task_id})   | 8. Publish Completion Event
    +<----------------------------------------------+-----------------------------+

```

### 6.1 Authentication Workflow

* **Protocol:** Stateless JSON Web Token (JWT) architecture using `RS256` asymmetric keys.
* **Token Rotation:** Access tokens (15-minute expiry) paired with HttpOnly Refresh tokens (7-day sliding expiry).
* **Token Payload Structure:**

```json
{
  "sub": "48b6c41b-4ef9-450f-90e8-0b543df5a610",
  "email": "agent.smith@fbi.gov",
  "role": "INVESTIGATOR",
  "iss": "antigravity-auth-service",
  "exp": 1774000000
}

```

### 6.2 External and Internal API Specification

#### `POST /api/v1/investigations/dispatch`

* **Access:** `ROLE_INVESTIGATOR`, `ROLE_ADMIN`
* **Request Payload:**

```json
{
  "case_id": "c1f7a22a-5793-4a1b-bd57-a37a13d789e4",
  "seed_wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "network": "ETHEREUM",
  "max_depth": 5,
  "min_usd_threshold": 500.00
}

```

* **Response (HTTP 202 Accepted):**

```json
{
  "task_id": "f5f0b5d9-4ad3-4c9f-b984-904c622ce9df",
  "status": "QUEUED",
  "event_stream": "/api/v1/investigations/events/f5f0b5d9-4ad3-4c9f-b984-904c622ce9df"
}

```

#### `GET /api/v1/investigations/events/{task_id}`

* **Protocol:** Server-Sent Events (SSE)
* **Stream Events:**

```text
event: progress
data: {"stage": "GRAPH_EXPANSION", "current_depth": 2, "nodes_discovered": 143}

event: inference
data: {"stage": "GNN_CLUSTERING", "entities_resolved": 4, "vasp_hits": 2}

event: complete
data: {"status": "SUCCESS", "subgraph_uri": "/api/v1/graph/export/f5f0b5d9-4ad3-4c9f-b984-904c622ce9df"}

```

### 6.3 Asynchronous Inference Pipeline Specifications

1. **Extraction:** Celery worker retrieves wallet network transactions from an indexed full-node RPC endpoint and stores the raw edge list in Neo4j.
2. **Tensor Transformation:** Worker queries the Neo4j GDS projection to transform the localized subgraph into PyTorch Geometric `Data(x, edge_index)` formats:
* Node Features ($x$): 64-dimensional vector (historical volume, incoming/outgoing degree ratio, lifetime span, transaction variance, peel-chain frequency score).
* Edge Indices: Adjacency list formatted as an integer tensor.


3. **GraphSAGE Model Execution:** The inductive model aggregates neighborhood embeddings:
* Hidden Channels: 128
* Number of Layers: 3
* Activation: LeakyReLU
* Output: 32-dimensional latent embedding vector per node.


4. **Clustering & VASP Matching:** K-Means/HDBSCAN groups embeddings into `Entity` clusters; the terminal nodes are intersected with known `(:VASP)` addresses to identify cash-out points.
5. **Explainability Engine:** SHAP (Shapley Additive Explanations) assigns marginal contributions to features, outputting the specific behavioral rules responsible for flagging the entity.

---

## 7. Project Directory Structure

```
crypto-forensics-platform/
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── README.md
│
├── client/                                    # Next.js 14 Frontend Application
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── public/
│   └── src/
│       ├── app/                               # Next.js App Router Structure
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── login/
│       │   ├── dashboard/
│       │   ├── investigation/
│       │   │   └── [case_id]/
│       │   │       ├── workspace/
│       │   │       ├── entity-profiler/
│       │   │       └── audit-trail/
│       │   └── evidence/
│       │       └── [case_id]/export/
│       ├── components/                        # Reusable Component Architecture
│       │   ├── ui/                            # Shadcn UI primitives
│       │   ├── graph/                         # Graph Visualization Components
│       │   │   ├── CytoscapeCanvas.tsx        # High-performance 2D canvas
│       │   │   ├── GraphControls.tsx          # Filter, zoom, timeline slider
│       │   │   └── ThreeGlobeVisualizer.tsx   # Three.js cluster visualizer
│       │   └── common/
│       ├── hooks/                             # Custom React Hooks
│       │   ├── useSSE.ts                      # Server-Sent Events subscriber
│       │   └── useGraphData.ts
│       ├── lib/                               # Client Utilities & API Definitions
│       │   ├── api.ts
│       │   └── utils.ts
│       └── types/                             # TypeScript Definitions
│           ├── graph.d.ts
│           └── api.d.ts
│
├── server/                                    # Python FastAPI Application
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── app/
│       ├── main.py                            # FastAPI application entrypoint
│       ├── core/                              # App Configuration & Security
│       │   ├── config.py                      # Pydantic Settings
│       │   ├── security.py                    # JWT hashing, JWKS resolution
│       │   └── database.py                    # Engine & Session Factories
│       ├── api/                               # API Routing Layer
│       │   ├── v1/
│       │   │   ├── endpoints/
│       │   │   │   ├── auth.py
│       │   │   │   ├── cases.py
│       │   │   │   ├── investigations.py
│       │   │   │   ├── graph.py
│       │   │   │   └── vasp.py
│       │   │   └── api_router.py
│       ├── models/                            # SQLAlchemy ORM Models
│       │   ├── user.py
│       │   ├── case.py
│       │   ├── vasp.py
│       │   └── evidence.py
│       ├── schemas/                           # Pydantic In/Out Schemas
│       │   ├── case_schema.py
│       │   ├── graph_schema.py
│       │   └── auth_schema.py
│       └── services/                          # Business Logic Layer
│           ├── auth_service.py
│           ├── rpc_client.py
│           └── neo4j_service.py
│
├── worker/                                    # Celery Asynchronous & ML Workers
│   ├── Dockerfile
│   └── worker_app/
│       ├── celery_app.py                      # Celery Worker Configuration
│       ├── tasks/                             # Background Task Handlers
│       │   ├── extraction_tasks.py            # Blockchain RPC fetchers
│       │   ├── graph_tasks.py                 # Neo4j bulk loading
│       │   └── ml_tasks.py                    # GNN entity resolution
│       └── ml/                                # Machine Learning Models
│           ├── models/
│           │   ├── graphsage.py               # PyTorch Geometric Architecture
│           │   └── mdst_gnn.py                # Temporal Graph Anomaly Model
│           ├── pipelines/
│           │   ├── feature_builder.py         # Subgraph to PyG Tensor ETL
│           │   └── explainability.py          # SHAP attribution generators
│           └── weights/                       # Pre-trained Model Checkpoints
│               └── graphsage_v1.pth
│
├── database/                                  # Database Migrations & Seeders
│   ├── postgres/
│   │   ├── alembic.ini
│   │   └── alembic/
│   │       ├── env.py
│   │       └── versions/
│   └── neo4j/
│       └── schema_constraints.cypher          # Constraints and DB setup queries
│
└── infrastructure/                            # Deployment Orchestration
    ├── nginx/
    │   └── default.conf
    └── prometheus/
        └── prometheus.yml

```

---

## 8. Verification, Testing & Startup Protocol

### 8.1 System Environment Initialization

Execute all baseline provisioning commands from the root repository directory:

```bash
# 1. Clone & Setup Environment Configuration
cp .env.example .env

# 2. Build and Launch Base Containers (PostgreSQL, Neo4j, Redis)
docker compose up -d postgres neo4j redis

# 3. Wait for Database Readiness
docker compose exec postgres pg_isready -U postgres -d crypto_forensics
docker compose exec neo4j cypher-shell -u neo4j -p "TestPassword123" "RETURN 1;"

```

### 8.2 Database Migration & Schema Bootstrap

```bash
# 4. Apply PostgreSQL Migrations via Alembic (inside Server container)
docker compose run --rm server alembic upgrade head

# 5. Initialize Neo4j Schema Constraints & Indices
docker compose exec neo4j cypher-shell -u neo4j -p "TestPassword123" -f /database/neo4j/schema_constraints.cypher

```

### 8.3 Full System Orchestration

```bash
# 6. Build and Spin Up Remaining Platform Microservices
docker compose up --build -d server worker client nginx

# 7. Verify All Container States
docker compose ps

```

### 8.4 Verification Test Suite

```bash
# Test 8.1: Verify PostgreSQL Relational Connectivity
curl -f http://localhost:8000/api/v1/health/db-sql || exit 1

# Test 8.2: Verify Neo4j Graph Driver Connectivity
curl -f http://localhost:8000/api/v1/health/db-graph || exit 1

# Test 8.3: Verify Celery Worker Status via Redis Ping
docker compose exec server celery -A app.core.celery_app inspect ping

# Test 8.4: Execute End-to-End Test Suite (PyTest)
docker compose exec server pytest tests/ -v

# Test 8.5: Verify Frontend SSR & Asset Compilation
curl -I http://localhost:3000/login

```

---

## Execution Protocol

```
TO: Antigravity AI
TARGET: Automated Build Engine
DIRECTIVE: Full-Stack Implementation Sequence

```

Antigravity AI is explicitly instructed to construct, compile, and configure the application defined in this specification document by executing the following **four sequential phases** in strict priority order. Do not skip or alter the ordering of these steps:

### Phase 1: Folder Structure Setup

* Generate the entire monorepo directory layout exactly as mapped in **Section 7 (`Project Directory Structure`)**.
* Create all stub files, component containers, module configurations, `package.json`, `pyproject.toml`, `alembic.ini`, and `docker-compose.yml`.
* Ensure directory permissions allow seamless volume mounting for containerized development.

### Phase 2: DBMS Setup & Migrations

* Stand up the database containers: **PostgreSQL 16** and **Neo4j 5.x** with the Graph Data Science (GDS) library enabled.
* Execute the SQL schema definitions provided in **Section 5.2** via Alembic migration scripts. Ensure all primary keys, foreign keys, enums, and indexes are locked down.
* Apply the Cypher constraints, uniqueness rules, and spatial-temporal indexes defined in **Section 5.3** into the active Neo4j instance.
* Seed the PostgreSQL database with the initial administrator account and the seed list of VASP entities.

### Phase 3: Backend APIs & Async Task Pipeline

* Implement the **FastAPI** server using Python 3.11+ within `/server`. Configure CORS, error handlers, and the Pydantic schemas.
* Integrate **JWT (RS256) RBAC** authentication middleware enforcing `ROLE_INVESTIGATOR`, `ROLE_ANALYST`, and `ROLE_ADMIN` route protections.
* Implement the Celery task queue configurations in `/worker` with **Redis 7** as the message broker.
* Implement the API endpoints detailed in **Section 6.2**, including the SSE event stream for long-polling tasks.
* Instantiate the PyTorch Geometric **GraphSAGE** embedding inference loop in `/worker/worker_app/ml/` for inductive entity clustering.

### Phase 4: Frontend Graphics & User Interface

* Scaffold the **Next.js 14** application with App Router, TypeScript, and Tailwind CSS within `/client`.
* Build the authenticated layout and wire the role-guarded views matching **Section 5.1**.
* Implement the `/investigation/[case_id]/workspace` interface:
* Mount the **Cytoscape.js** engine using `fcose` for 2D transaction network topologies.
* Integrate the **Three.js** / React Three Fiber visualizer to render global fund distribution flows.
* Implement the Server-Sent Events hook (`useSSE`) to stream live graph updates from the Celery worker directly to the active canvas.


* Implement the **Forensic Export Hub** to generate ISO/IEC 27037 compliant audit reports with matching SHA-256 integrity verification hashes.

---

## 9. Enterprise 105-Feature Intelligence Roadmap

The platform implements a government-grade intelligence suite meeting statutory admissibility standards (18 U.S.C. § 981 / 1956) and law enforcement forensic requirements across 10 core domains:

### 9.1 Blockchain & Network Expansion (1–10)
1. **Solana & Tron Support:** Dedicated ingestion for non-EVM chains, specifically Tron TRC-20 high-velocity USDT laundering rings.
2. **Monero (XMR) Heuristics:** Probabilistic timing and volume correlation heuristics for privacy coin hop analysis.
3. **Bitcoin UTXO Visualizer:** Graph model supporting Unspent Transaction Outputs (UTXOs) with input/output multi-hop clustering.
4. **Lightning Network Analysis:** Channel opening and closing deanonymization to expose routing nodes.
5. **Cross-Chain Bridge Deanonymization:** Timestamp and liquidity volume matching across Ethereum, Arbitrum, Optimism, and Avalanche bridges.
6. **NFT Wash Trading Detection:** Cyclical wash-trading detection engine identifying artificial volume inflation.
7. **Smart Contract Exploit Overlay:** Direct annotation of reentrancy, flash loan, and mint exploit contracts.
8. **Mempool Scanning:** Pre-confirmation transaction tracking to alert investigators before suspect funds settle.
9. **DEX Slippage & Swap Routing:** Path-tracing through automated market makers (Uniswap, Curve, Balancer) tracking intermediate tokens.
10. **Layer 2 Rollup Tracing:** Native RPC integration for Arbitrum, Optimism, Base, and zkSync Era.

### 9.2 AI, Machine Learning & Analytics (11–20)
11. **LLM "Chat with the Graph":** Natural language query assistant transforming investigator questions into structured graph filters and executive briefings.
12. **Predictive Off-Ramping:** ML model predicting destination VASPs and cash-out probability distributions based on historical syndicate patterns.
13. **Behavioral Clustering Algorithm:** Entity resolution grouping disparate wallets into single criminal syndicate profiles.
14. **Time-Series Forecasting:** Trajectory models predicting future transaction bursts based on historical laundering rhythms.
15. **Automated Smart Contract Decompilation:** AI-generated human-readable summaries of unverified target contracts.
16. **Flash Loan Attack Profiling:** Algorithmic detection of complex multi-protocol DeFi manipulation transactions.
17. **Gas Price Manipulation Tracking:** Priority bribe and MEV bundle tracking to identify urgent capital evacuations.
18. **Sybil/Deepfake ID Correlation:** Cross-referencing mule clusters suspected of synthetic identity exchange account openings.
19. **Reinforcement Learning Anomaly Tuning:** Investigator feedback loop (upvote/downvote flags) refining risk classifier thresholds.
20. **NLP OSINT Extraction:** Context extraction correlating public hacker forums, Twitter, and Telegram leak channels with wallet addresses.

### 9.3 Real-Time Monitoring & Alerts (21–30)
21. **Dormant Wallet Alerts:** Automated alerts triggered when wallets inactive for >365 days suddenly move capital.
22. **Threshold-Based Alerts:** Configurable webhooks triggered when transactions exceed custom fiat values (e.g., >$50,000 USD).
23. **VASP Webhook Integration:** Real-time push notifications delivered to partnered exchange compliance desks.
24. **Live WebSocket Dashboard:** Real-time investigative "war room" feed streaming block confirmations for active pursuits.
25. **Geographic Jump Alerts:** Telemetry warnings when a wallet's broadcast IP relay changes continents within impossible travel windows.
26. **Custom Alert Rules Engine:** Rule builder enabling investigators to write boolean detection logic (e.g., `volume > 10000 AND hop_count < 3`).
27. **Mobile App Push Notifications:** Field agent push notification dispatch for critical target alerts.
28. **Daily Case Digest Emails:** Scheduled summaries detailing all on-chain movements across active investigations in the past 24 hours.
29. **Auto-Freeze API Execution:** Direct API triggers executing emergency freeze requests when Threat Index exceeds 95.0.
30. **Mixer Pool Interaction Alerts:** Immediate high-priority flags when tracked funds interact with Tornado Cash, Railgun, or CashFusion.

### 9.4 Enhanced UI/UX & Visualizations (31–40)
31. **Temporal Timeline Slider:** Interactive chronological playback slider to scrub through the lifecycle of the crime.
32. **WebXR / VR Support:** 3D immersive graph exploration mode for virtual reality visualization of massive syndicates.
33. **Sankey Flow Diagrams:** Liquidity distribution diagrams highlighting proportional volume shrinkage across mule rings.
34. **Custom Node Tagging & Coloring:** Color-coded investigator tags (e.g., Blue for "Informant", Yellow for "Unverified", Pink for "Decoy").
35. **Collapsible Clusters:** Expandable super-nodes grouping 50+ smurfing mule wallets to maintain canvas clarity.
36. **Density Heatmaps:** Choropleth and density overlays highlighting geographic jurisdictions with high illicit off-ramping activity.
37. **Picture-in-Picture (PiP) Graph Comparison:** Dual-viewport side-by-side graph comparison to detect overlapping syndicate tactics.
38. **Graph Export Formats:** Seamless export to Gephi, Maltego, and GraphML formats for cross-agency intelligence sharing.
39. **Address Book Panel:** Managed contacts registry for verified government agencies, exchanges, and blacklisted entities.
40. **Dark/Light Mode Accessibility:** WCAG 2.1 AA compliant high-contrast modes tailored for colorblind investigators.

### 9.5 Law Enforcement & Compliance Tools (41–50)
41. **Automated Subpoena Generation:** Pre-filled legal subpoena templates populated with target deposit addresses, case numbers, and timestamps.
42. **FinCEN SAR API Integration:** One-click generation and submission of Suspicious Activity Reports (Form 111).
43. **Chain of Custody Portal:** Dedicated verification portal for prosecutors and judges to validate the SHA-256 digital evidence seal.
44. **Interpol Red Notice Cross-Referencing:** Mapping wallet IP coordinates against known fugitive international notice records.
45. **OFAC Sanctions Auto-Flagging:** Automated cross-referencing against the US Treasury's Specially Designated Nationals (SDN) list.
46. **FATF Travel Rule Checker:** Automatic highlighting of transactions violating international Travel Rule threshold limits ($1,000 / $3,000 USD).
47. **Localized Legal Templates:** Export formats tailored to US (FBI/DOJ), UK (NCA), and EU (Europol) evidence standards.
48. **PDF Redaction Tools:** Secure redaction tools to black out undercover agent credentials and confidential informant addresses.
49. **Immutable Audit Export:** Comprehensive export of all investigator platform actions for discovery under Federal Rule of Evidence 902(14).
50. **DocuSign/eSign Integration:** Digital signature workflow allowing supervisory approval before warrant applications.

### 9.6 Collaboration & Multi-Tenancy (51–60)
51. **Figma-Style Multiplayer:** Real-time multi-investigator cursors and shared state on the 2D Cytoscape graph.
52. **Secure Case Invite Links:** Encrypted, time-expiring guest tokens for inter-agency coordination.
53. **In-Graph Commenting Threads:** Threaded node and edge annotations for active investigator discussions.
54. **Shift Hand-Off Protocols:** Automated shift-change summary reports detailing all discoveries during the preceding shift.
55. **Multi-Agency Federation:** Fine-grained tenant isolation allowing federal and municipal agencies to collaborate securely.
56. **Granular Field Masking:** Role-based field masking hiding sensitive USD balances or source IP addresses based on clearance.
57. **Case Merging:** Dynamic graph merging to unify independent investigations when common mule wallets are identified.
58. **Threat Intel Wiki:** Internal agency knowledge base cataloging known threat actor tactics, techniques, and procedures (TTPs).
59. **Video Briefing Capture:** In-browser screen and telemetry recording attached directly to the evidence archive.
60. **Team Workspaces:** Isolated investigative sandboxes allowing agents to run hypothetical tracing scenarios.

### 9.7 Threat Intelligence & External Data (61–70)
61. **Community Abuse Feeds:** Integration with crowdsourced scam and fraud databases for instant address attribution.
62. **Darknet Forum Scraper:** Automated discovery matching addresses pasted across Tor hidden services and marketplaces.
63. **Telegram OTC Desk Crawler:** Monitoring public OTC broker channels for transactions matching target addresses.
64. **Phishing Domain Correlation:** Linking smart contract addresses to malicious phishing domains via DNS/WHOIS records.
65. **Malware Family Mapping:** Automatic attribution linking wallets to known ransomware strains (LockBit, BlackCat, Akira).
66. **Proxy/VPN Exit Node DB:** Tagging broadcast IPs matching commercial VPNs (Mullvad, NordVPN) or Tor exit nodes.
67. **CEX Infrastructure Registry:** Daily updated mapping of centralized exchange hot, cold, and deposit address infrastructure.
68. **Ransomware Note Parser:** Automatic extraction of target cryptocurrency addresses from uploaded ransom demand text files.
69. **Social Media Avatar Matching:** Correlating target NFT holdings with public social media avatar profiles.
70. **IP-to-ASN Enrichment:** Resolving node broadcast IPs to autonomous system numbers, hosting datacenters, and ISPs.

### 9.8 Security, Privacy & Access Control (71–80)
71. **Hardware Security Key (FIDO2/YubiKey):** Mandatory WebAuthn physical token enforcement for elevated privileges.
72. **Air-Gapped Deployment:** Containerized packaging supporting offline deployment in classified environments (SCIF).
73. **Zero-Knowledge Proof (ZKP) Queries:** Privacy-preserving queries checking exchange hits without exposing suspect addresses.
74. **AES-256 Case Encryption:** Envelope encryption of all investigative notes, audit logs, and evidence at rest.
75. **Auto-Session Timeout & Screen Blur:** Automatic canvas obfuscation and session lock after 3 minutes of inactivity.
76. **Dynamic UI Watermarking:** Subtle forensic watermarking overlaying investigator email and timestamp to prevent unauthorized leaks.
77. **IP Subnet Whitelisting:** Firewall-level restriction limiting access exclusively to authorized government subnets.
78. **Mobile Biometrics:** Biometric authentication (FaceID / Fingerprint) required for field alerts.
79. **PII Auto-Redaction in Logs:** Automated masking of personally identifiable information in server and worker logs.
80. **Secure Enclave Processing:** Hardware enclave isolation for evidence signing key generation.

### 9.9 System Scalability & DevOps Architecture (81–90)
81. **OpenTelemetry Distributed Tracing:** End-to-end tracing spanning Next.js, FastAPI, Celery, and Neo4j.
82. **GraphQL API Layer:** Flexible query layer reducing client payload size during dense graph traversals.
83. **Redis Caching Layer:** High-speed caching for hot-wallet balances and static VASP metadata.
84. **Kafka Event Streaming:** Distributed log architecture ingesting real-time block streams asynchronously.
85. **Neo4j Read-Replica Cluster:** Query routing distributing analytical graph queries across read replicas.
86. **Kube-Prometheus Stack:** Infrastructure health metrics, CPU utilization, and task queue saturation dashboards.
87. **Serverless Edge Computation:** Offloading Cartesian trigonometry for 3D globe coordinates to edge runtimes.
88. **Cloudflare DDoS & WAF:** Web application firewall preventing retaliatory attacks from criminal targets.
89. **Automated S3 Data Archiving:** Cold-storage tiering archiving closed cases (>5 years) to AWS S3 Glacier.
90. **Multi-Region Backend:** Geographically distributed nodes minimizing latency for multinational joint task forces.

### 9.10 Workflow Automations & Investigator Tools (91–105)
91. **Bulk Address CSV Upload:** Mass ingestion parsing up to 1,000 suspect addresses in a single operation.
92. **Historical Fiat Converter:** Calculating the exact USD value on the specific date and time the transfer occurred.
93. **Syndicate Overhead Analyzer:** Accounting for total gas fees and miner tips consumed by the criminal syndicate.
94. **"What-If" Scenario Simulator:** Interactive edge severing simulating asset flow re-routing under hypothetical VASP freezes.
95. **Text-to-Graph Parser:** Automatic extraction of addresses and transaction hashes from pasted intelligence briefs.
96. **Global Command Palette (Cmd+K / Ctrl+K):** Instant modal search across cases, addresses, and forensic commands.
97. **Keyboard Navigation Shortcuts:** Full keyboard accessibility for graph traversal, zooming, and node inspection.
98. **Auto-Translation of OSINT:** Machine translation translating foreign underground forum posts into English.
99. **Power-User Forensic Terminal (CLI):** Integrated command-line interface for typing rapid investigation queries.
100. **Decoy Wallet Generator:** Provisioning monitored undercover bait wallets for active sting operations.
101. **Offline PWA Mode:** Offline caching enabling field agents to inspect active graphs without internet connectivity.
102. **Wallet Behavioral Profiling Tags:** Heuristic labeling classifying wallets as "Gambler", "Mixer", "Bot", or "Arbitrageur".
103. **Interactive Onboarding Tutorial:** Interactive guided simulation training junior investigators on complex multi-hop tracing.
104. **Custom 3rd-Party Plugin Architecture:** Modular extension API allowing law enforcement agencies to connect private intel feeds.
105. **One-Click Seizure & Freeze Mandate:** Instant generation and dispatch of digital asset freeze orders to partnered VASPs.

---

## 10. Multi-Chain, AI Copilot & Compliance Technical Specifications

### 10.1 Multi-Chain Ingestion Models
* **Account-Based EVM:** Supports Ethereum, Arbitrum, Optimism, Base, and Polygon with native gas accounting and internal contract call extraction.
* **Tron (TRC-20 USDT):** Simulates high-speed energy/bandwidth usage, TRC-20 transfer event logs (`a9059cbb`), and exchange deposit clustering.
* **Bitcoin UTXO Model:** Implements unspent transaction output graphs connecting inputs ($V_{in}$) and outputs ($V_{out}$) with multi-input clustering heuristics.

### 10.2 AI Copilot Architecture
* **Natural Language Parsing:** Evaluates investigator questions using intent classification and entity extraction.
* **Graph Query Synthesis:** Converts user intent into structured node filter predicates (e.g., `volume > 10000`, `entity == "VASP"`).
* **Forensic Explanations:** Generates step-by-step narrative briefings describing laundering methodologies, peel chain mechanisms, and VASP off-ramps.

### 10.3 Compliance & Asset Seizure Framework
* **OFAC SDN Screener:** Real-time fuzzy address and alias matching against Treasury sanctions lists.
* **FATF Travel Rule Engine:** Real-time flagging of cross-border transfers exceeding $1,000 USD (EU) or $3,000 USD (FinCEN).
* **Emergency Freeze Mandates:** Formatted legal directives citing 18 U.S.C. § 981 (Civil Forfeiture) and 18 U.S.C. § 1956 (Money Laundering) with cryptographic SHA-256 seal.