import { useState, useEffect, useCallback } from "react";
import { ApiClient } from "@/lib/api";
import { GraphPayload, GraphNode, GraphEdge } from "@/types/graph";

export interface UseGraphDataOptions {
  autoFetch?: boolean;
  minUsdThreshold?: number;
}

export function useGraphData(caseId: string, options: UseGraphDataOptions = {}) {
  const { autoFetch = true, minUsdThreshold = 0 } = options;

  const [graphData, setGraphData] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.graph.getSubgraph(caseId);
      setGraphData(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load graph topology data");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (autoFetch && caseId) {
      fetchGraph();
    }
  }, [autoFetch, caseId, fetchGraph]);

  // Filtered nodes and edges based on threshold
  const filteredNodes: GraphNode[] = (graphData?.nodes || []).filter((node) => {
    if (minUsdThreshold <= 0) return true;
    return (node.data.balance || 0) * 3000 >= minUsdThreshold || node.data.is_seed || node.data.type === "vasp";
  });

  const validNodeIds = new Set(filteredNodes.map((n) => n.data.id));

  const filteredEdges: GraphEdge[] = (graphData?.edges || []).filter((edge) => {
    if (!validNodeIds.has(edge.data.source) || !validNodeIds.has(edge.data.target)) {
      return false;
    }
    if (minUsdThreshold <= 0) return true;
    return (edge.data.amount_usd || (edge.data.amount * 3000)) >= minUsdThreshold;
  });

  return {
    graphData,
    nodes: filteredNodes,
    edges: filteredEdges,
    anomalies: graphData?.anomalies || null,
    loading,
    error,
    reload: fetchGraph,
  };
}
