import { useEffect, useState, useRef } from "react";
import { ApiClient } from "@/lib/api";

export interface SSEEventData {
  stage?: string;
  current_depth?: number;
  nodes_discovered?: number;
  entities_resolved?: number;
  vasp_hits?: number;
  status?: string;
  subgraph_uri?: string;
  clusters?: any[];
}

export function useSSE(taskId: string | null, onComplete?: (data: SSEEventData) => void) {
  const [events, setEvents] = useState<Array<{ type: string; data: SSEEventData }>>([]);
  const [currentStage, setCurrentStage] = useState<string>("INITIALIZING");
  const [progress, setProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const url = ApiClient.investigations.getEventStreamUrl(taskId);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("progress", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as SSEEventData;
        setCurrentStage(parsed.stage || "GRAPH_EXPANSION");
        if (parsed.current_depth) {
          setProgress(Math.min(90, parsed.current_depth * 18));
        }
        setEvents((prev) => [...prev, { type: "progress", data: parsed }]);
      } catch (_) {}
    });

    es.addEventListener("inference", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as SSEEventData;
        setCurrentStage("GNN_CLUSTERING");
        setProgress(85);
        setEvents((prev) => [...prev, { type: "inference", data: parsed }]);
      } catch (_) {}
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as SSEEventData;
        setCurrentStage("COMPLETED");
        setProgress(100);
        setIsCompleted(true);
        setEvents((prev) => [...prev, { type: "complete", data: parsed }]);
        if (onComplete) {
          onComplete(parsed);
        }
      } catch (_) {}
      es.close();
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [taskId]);

  return {
    events,
    currentStage,
    progress,
    isCompleted,
  };
}
