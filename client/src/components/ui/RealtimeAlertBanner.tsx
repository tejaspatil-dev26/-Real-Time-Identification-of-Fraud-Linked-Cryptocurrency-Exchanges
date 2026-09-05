"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X, Info, ShieldAlert } from "lucide-react";
import { ApiClient } from "../../lib/api";

interface Alert {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  entity_id: string;
}

export function RealtimeAlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // In a real app, this would be a WebSocket or SSE connection
    // For now, we poll every 10 seconds
    const fetchAlerts = async () => {
      try {
        const response = await ApiClient.alerts.list("NEW");
        if (response && response.length > 0) {
          setAlerts(response);
          setVisible(true);
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!visible || alerts.length === 0) return null;

  const handleDismiss = async (id: string) => {
    try {
      await ApiClient.alerts.updateStatus(id, "ACKNOWLEDGED");
      setAlerts(alerts.filter(a => a.id !== id));
      if (alerts.length <= 1) {
        setVisible(false);
      }
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "HIGH": return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case "MEDIUM": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "LOW": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default: return "bg-gray-500/20 text-gray-500 border-gray-500/50";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return <ShieldAlert className="w-5 h-5" />;
      case "HIGH": return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const currentAlert = alerts[0]; // Show the most recent one

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg border backdrop-blur-md shadow-2xl transition-all duration-300 ${getSeverityColor(currentAlert.severity)}`}>
      <div className="flex-shrink-0 mr-3">
        {getSeverityIcon(currentAlert.severity)}
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-bold uppercase tracking-wider">{currentAlert.severity} ALERT - {currentAlert.type}</h4>
        <p className="text-sm opacity-90">{currentAlert.message}</p>
        <div className="text-xs mt-1 opacity-75 font-mono">Target: {currentAlert.entity_id}</div>
      </div>
      <button 
        onClick={() => handleDismiss(currentAlert.id)}
        className="ml-4 p-1 hover:bg-black/20 rounded transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      {alerts.length > 1 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {alerts.length}
        </div>
      )}
    </div>
  );
}
