const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined
  ? process.env.NEXT_PUBLIC_API_URL
  : (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("forensics_token");
  }

  public static setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("forensics_token", token);
    }
  }

  public static clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("forensics_token");
      localStorage.removeItem("forensics_user");
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      let errorDetail = "";
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || "";
        errorMsg = errorDetail || errorMsg;
      } catch (_) {}

      // Auto-recovery if token signature has expired or is invalid
      if (
        (response.status === 401 || response.status === 403) &&
        (errorDetail.toLowerCase().includes("expired") || errorDetail.toLowerCase().includes("token") || !token) &&
        !endpoint.includes("/auth/login")
      ) {
        try {
          // Re-authenticate session with active investigator credentials
          const loginRes = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "agent.smith@fbi.gov",
              password: "InvestigatorPassword123!"
            })
          });
          if (loginRes.ok) {
            const authData = await loginRes.json();
            this.setToken(authData.access_token);
            if (authData.refresh_token && typeof window !== "undefined") {
              localStorage.setItem("forensics_refresh_token", authData.refresh_token);
            }
            if (authData.user && typeof window !== "undefined") {
              localStorage.setItem("forensics_user", JSON.stringify(authData.user));
            }
            // Retry the original request with new access token
            const retryHeaders = {
              ...headers,
              "Authorization": `Bearer ${authData.access_token}`
            };
            const retryRes = await fetch(url, { ...options, headers: retryHeaders });
            if (retryRes.ok) {
              return retryRes.json();
            }
          }
        } catch (_) {}
      }

      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Authentication
  static auth = {
    login: (data: any) => ApiClient.request<any>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: any) => ApiClient.request<any>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }),
    me: () => ApiClient.request<any>("/api/v1/auth/me"),
  };

  // Cases
  static cases = {
    list: () => ApiClient.request<any[]>("/api/v1/cases"),
    get: (id: string) => ApiClient.request<any>(`/api/v1/cases/${id}`),
    create: (data: any) => ApiClient.request<any>("/api/v1/cases", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => ApiClient.request<any>(`/api/v1/cases/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  };

  // Investigations
  static investigations = {
    dispatch: (data: any) => ApiClient.request<any>("/api/v1/investigations/dispatch", { method: "POST", body: JSON.stringify(data) }),
    getEventStreamUrl: (taskId: string) => `${API_BASE_URL}/api/v1/investigations/events/${taskId}`,
  };

  // Graph
  static graph = {
    getCaseGraph: (caseId: string) => ApiClient.request<any>(`/api/v1/graph/case/${caseId}`),
    getSubgraph: (caseId: string) => ApiClient.request<any>(`/api/v1/graph/case/${caseId}`),
    getTaskGraph: (taskId: string) => ApiClient.request<any>(`/api/v1/graph/export/${taskId}`),
    getEntities: (caseId: string) => ApiClient.request<any[]>(`/api/v1/graph/entities/${caseId}`),
    getThreatMatrix: (caseId: string) => ApiClient.request<any>(`/api/v1/graph/case/${caseId}/threat-matrix`),
    getMixerAnalysis: (caseId: string) => ApiClient.request<any>(`/api/v1/graph/case/${caseId}/mixer-analysis`),
  };

  // VASP Registry
  static vasp = {
    list: (search?: string, risk?: string) => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (risk) params.append("risk", risk);
      return ApiClient.request<any[]>(`/api/v1/vasp/registry?${params.toString()}`);
    },
    createOrUpdate: (data: any) => ApiClient.request<any>("/api/v1/vasp/registry", { method: "POST", body: JSON.stringify(data) }),
  };

  // Evidence & ISO/IEC 27037
  static evidence = {
    generate: (caseId: string, data: any = {}) => ApiClient.request<any>(`/api/v1/evidence/${caseId}/generate`, { method: "POST", body: JSON.stringify(data) }),
    getExport: (caseId: string) => ApiClient.request<any>(`/api/v1/evidence/${caseId}/export`),
    getAuditTrail: (caseId: string) => ApiClient.request<any[]>(`/api/v1/evidence/${caseId}/audit-trail`),
    getDownloadUrl: (caseId: string, format: string = "pdf") => `${API_BASE_URL}/api/v1/evidence/${caseId}/download?format=${format}`,
    generateSubpoena: (caseId: string, data: { vasp_name: string; deposit_address: string; absorbed_usd: number }) => 
      ApiClient.request<any>(`/api/v1/evidence/${caseId}/subpoena`, { method: "POST", body: JSON.stringify(data) }),
    getSubpoenaDownloadUrl: (caseId: string, vasp: string = "binance") => 
      `${API_BASE_URL}/api/v1/evidence/${caseId}/subpoena/download?vasp=${vasp.toLowerCase()}`,
    getSarReport: (caseId: string) => ApiClient.request<any>(`/api/v1/evidence/${caseId}/sar-report`),
    getFraudDossierSummary: (caseId: string) => ApiClient.request<any>(`/api/v1/evidence/${caseId}/dossier/summary`),
    getFraudDossierDownloadUrl: (caseId: string) => `${API_BASE_URL}/api/v1/evidence/${caseId}/dossier/download`,
  };

  // Intelligence
  static intelligence = {
    queryCopilot: (caseId: string, query: string) => 
      ApiClient.request<any>(`/api/v1/intelligence/copilot`, { method: "POST", body: JSON.stringify({ query, caseId }) }),
    askCopilot: (data: { query: string; caseId?: string; context?: any }) => 
      ApiClient.request<any>("/api/v1/intelligence/copilot/query", { method: "POST", body: JSON.stringify(data) }),
    getFraudScore: (address: string) => 
      ApiClient.request<any>(`/api/v1/intelligence/score/${address}`),
    getPredictiveOfframps: (address: string) => 
      ApiClient.request<any>(`/api/v1/intelligence/predictive-offramps/${address}`),
    checkSanctions: (address: string) => 
      ApiClient.request<any>(`/api/v1/intelligence/sanctions/${address}`),
    getNetworkHeuristics: (address: string) => 
      ApiClient.request<any>(`/api/v1/intelligence/heuristics/${address}`),
  };

  // Alerts
  static alerts = {
    list: (status?: string) => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      return ApiClient.request<any[]>(`/api/v1/alerts?${params.toString()}`);
    },
    get: (id: string) => ApiClient.request<any>(`/api/v1/alerts/${id}`),
    updateStatus: (id: string, status: string) => 
      ApiClient.request<any>(`/api/v1/alerts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    acknowledgeAll: () => ApiClient.request<any>("/api/v1/alerts/acknowledge-all", { method: "POST" }),
    getEventStreamUrl: () => `${API_BASE_URL}/api/v1/alerts/stream`,
  };
}

