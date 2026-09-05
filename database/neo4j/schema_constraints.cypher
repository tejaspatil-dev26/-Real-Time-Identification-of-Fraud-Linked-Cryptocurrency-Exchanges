// ==============================================================================
// Neo4j 5.x Schema Constraints and Indexes for Real-Time Crypto-Forensics
// ==============================================================================

// Uniqueness Constraints
CREATE CONSTRAINT uq_wallet_address IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE;
CREATE CONSTRAINT uq_tx_hash IF NOT EXISTS FOR (t:Transaction) REQUIRE t.tx_hash IS UNIQUE;
CREATE CONSTRAINT uq_entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.entity_id IS UNIQUE;
CREATE CONSTRAINT uq_vasp_id IF NOT EXISTS FOR (v:VASP) REQUIRE v.vasp_id IS UNIQUE;

// Property Indexes for High-Performance BFS/DFS Traversal
CREATE INDEX idx_wallet_network IF NOT EXISTS FOR (w:Wallet) ON (w.network);
CREATE INDEX idx_wallet_risk_score IF NOT EXISTS FOR (w:Wallet) ON (w.risk_score);
CREATE INDEX idx_tx_timestamp IF NOT EXISTS FOR (t:Transaction) ON (t.timestamp);
CREATE INDEX idx_tx_amount IF NOT EXISTS FOR (t:Transaction) ON (t.amount);
CREATE INDEX idx_vasp_name IF NOT EXISTS FOR (v:VASP) ON (v.name);

// Seed Known VASP Registry Nodes in Neo4j
MERGE (binance:VASP {vasp_id: "vasp-binance-001"})
ON CREATE SET binance.name = "Binance", binance.jurisdiction = "KYM", binance.risk_level = "LOW";

MERGE (coinbase:VASP {vasp_id: "vasp-coinbase-002"})
ON CREATE SET coinbase.name = "Coinbase", coinbase.jurisdiction = "USA", coinbase.risk_level = "LOW";

MERGE (kraken:VASP {vasp_id: "vasp-kraken-003"})
ON CREATE SET kraken.name = "Kraken", kraken.jurisdiction = "USA", kraken.risk_level = "LOW";

MERGE (okx:VASP {vasp_id: "vasp-okx-004"})
ON CREATE SET okx.name = "OKX", okx.jurisdiction = "SYC", okx.risk_level = "LOW";

MERGE (htx:VASP {vasp_id: "vasp-htx-005"})
ON CREATE SET htx.name = "HTX (Huobi)", htx.jurisdiction = "SYC", htx.risk_level = "MEDIUM";

MERGE (tornado:VASP {vasp_id: "vasp-tornado-006"})
ON CREATE SET tornado.name = "Tornado Cash (Sanctioned)", tornado.jurisdiction = "UNKNOWN", tornado.risk_level = "CRITICAL";
