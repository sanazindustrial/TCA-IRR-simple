/**
 * Azure Storage Service
 * Replaces localStorage with Azure backend storage for:
 * - User preferences and settings
 * - Analysis results and reports
 * - Configuration data
 * - Audit logs
 */

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

// Storage key types for type safety
export type StorageKey =
  | 'user_preferences'
  | 'analysis_results'
  | 'tca_reports'
  | 'unified_records'
  | 'pending_report_sync'
  | 'pending_record_sync'
  | 'data_source_config'
  | 'audit_logs'
  | 'company_data'
  | 'analysis_input'
  | 'what_if_scenarios'
  | 'session_data';

// Generic storage item type
export interface StorageItem<T = unknown> {
  key: string;
  value: T;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

// Audit log entry type
export interface AuditLogEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'sync';
  entityType: 'report' | 'user' | 'config' | 'data_source' | 'analysis';
  entityId: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  details?: Record<string, unknown>;
  oldValue?: unknown;
  newValue?: unknown;
}

// Sync status type
export interface SyncStatus {
  lastSyncAt: string | null;
  pendingCount: number;
  isConnected: boolean;
  lastError?: string;
}

class AzureStorageService {
  private syncStatus: SyncStatus = {
    lastSyncAt: null,
    pendingCount: 0,
    isConnected: false,
  };

  // In-memory cache for quick access
  private cache: Map<string, StorageItem> = new Map();
  private auditLogs: AuditLogEntry[] = [];

  /**
   * Get current auth token from localStorage (temporary)
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Get current user info
   */
  private getCurrentUser(): { id: string; email: string } {
    if (typeof window === 'undefined') {
      return { id: 'system', email: 'system@tca-irr.com' };
    }
    try {
      const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      return {
        id: user.id || 'unknown',
        email: user.email || localStorage.getItem('userEmail') || 'unknown@tca-irr.com'
      };
    } catch {
      return { id: 'unknown', email: 'unknown@tca-irr.com' };
    }
  }

  /**
   * Check if backend is connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      this.syncStatus.isConnected = response.ok;
      return response.ok;
    } catch {
      this.syncStatus.isConnected = false;
      return false;
    }
  }

  /**
   * Save item to Azure storage via backend API
   */
  async setItem<T>(key: StorageKey | string, value: T, options?: {
    userId?: string;
    expiresAt?: string;
    metadata?: Record<string, unknown>;
  }): Promise<boolean> {
    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    const item: StorageItem<T> = {
      key,
      value,
      userId: options?.userId || user.id,
      createdAt: now,
      updatedAt: now,
      expiresAt: options?.expiresAt,
      metadata: options?.metadata,
    };

    // Save to cache immediately
    this.cache.set(key, item as StorageItem);

    // Save to localStorage as fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('localStorage save failed:', e);
      }
    }

    // Log the action
    this.logAudit('create', this.getEntityType(key), key, { key, valueSize: JSON.stringify(value).length });

    // Try to save to backend
    try {
      const connected = await this.checkConnection();
      if (!connected) {
        // Add to pending sync queue
        this.addToPendingSync(key, item);
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.getAuthToken() ? { 'Authorization': `Bearer ${this.getAuthToken()}` } : {}),
        },
        body: JSON.stringify({
          key,
          value,
          user_id: user.id,
          user_email: user.email,
          metadata: options?.metadata,
        }),
      });

      if (response.ok) {
        this.syncStatus.lastSyncAt = now;
        this.removeFromPendingSync(key);
        return true;
      }

      // If backend returns error, keep in localStorage
      console.warn('Backend storage save failed:', response.status);
      this.addToPendingSync(key, item);
      return false;
    } catch (error) {
      console.warn('Backend unavailable, saved to localStorage:', error);
      this.addToPendingSync(key, item);
      return false;
    }
  }

  /**
   * Get item from Azure storage
   */
  async getItem<T>(key: StorageKey | string): Promise<T | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached.value as T;
    }

    // Try localStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(key);
        if (local) {
          return JSON.parse(local) as T;
        }
      } catch {
        // Continue to backend
      }
    }

    // Try backend API
    try {
      const user = this.getCurrentUser();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/storage/${encodeURIComponent(key)}?user_id=${user.id}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...(this.getAuthToken() ? { 'Authorization': `Bearer ${this.getAuthToken()}` } : {}),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Cache the result
        if (data.value) {
          this.cache.set(key, data);
          return data.value as T;
        }
      }
    } catch (error) {
      console.warn('Backend storage get failed:', error);
    }

    return null;
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: StorageKey | string): Promise<boolean> {
    // Remove from cache
    this.cache.delete(key);

    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }

    // Log the action
    this.logAudit('delete', this.getEntityType(key), key, { key });

    // Try to delete from backend
    try {
      const user = this.getCurrentUser();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/storage/${encodeURIComponent(key)}?user_id=${user.id}`,
        {
          method: 'DELETE',
          headers: {
            ...(this.getAuthToken() ? { 'Authorization': `Bearer ${this.getAuthToken()}` } : {}),
          },
        }
      );
      return response.ok;
    } catch {
      return true; // Local delete succeeded
    }
  }

  /**
   * Save data source configuration
   */
  async saveDataSourceConfig(sources: unknown[]): Promise<boolean> {
    return this.setItem('data_source_config', sources, {
      metadata: { sourceCount: sources.length },
    });
  }

  /**
   * Get data source configuration
   */
  async getDataSourceConfig(): Promise<unknown[] | null> {
    return this.getItem<unknown[]>('data_source_config');
  }

  /**
   * Save analysis result
   */
  async saveAnalysisResult(companyName: string, result: unknown, reportType: 'triage' | 'dd'): Promise<string> {
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.setItem(`analysis_${id}`, {
      id,
      companyName,
      reportType,
      result,
      createdAt: new Date().toISOString(),
    });
    return id;
  }

  /**
   * Get audit logs
   */
  getAuditLogs(options?: {
    entityType?: AuditLogEntry['entityType'];
    action?: AuditLogEntry['action'];
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = [...this.auditLogs];

    // Load from localStorage if not in memory
    if (logs.length === 0 && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('audit_logs');
        if (stored) {
          logs = JSON.parse(stored);
          this.auditLogs = logs;
        }
      } catch {
        // Ignore
      }
    }

    // Apply filters
    if (options?.entityType) {
      logs = logs.filter(l => l.entityType === options.entityType);
    }
    if (options?.action) {
      logs = logs.filter(l => l.action === options.action);
    }
    if (options?.startDate) {
      logs = logs.filter(l => l.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      logs = logs.filter(l => l.timestamp <= options.endDate!);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Apply limit
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  }

  /**
   * Export audit logs to JSON
   */
  exportAuditLogs(options?: Parameters<typeof this.getAuditLogs>[0]): string {
    const logs = this.getAuditLogs(options);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Log an audit entry
   */
  private logAudit(
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    details?: Record<string, unknown>,
    oldValue?: unknown,
    newValue?: unknown
  ): void {
    const user = this.getCurrentUser();
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      entityType,
      entityId,
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      details,
      oldValue,
      newValue,
    };

    this.auditLogs.push(entry);

    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('audit_logs', JSON.stringify(this.auditLogs.slice(-500)));
      } catch {
        // Storage full, trim logs
        this.auditLogs = this.auditLogs.slice(-100);
      }
    }
  }

  /**
   * Get entity type from storage key
   */
  private getEntityType(key: string): AuditLogEntry['entityType'] {
    if (key.includes('report')) return 'report';
    if (key.includes('user')) return 'user';
    if (key.includes('config') || key.includes('source')) return 'config';
    if (key.includes('analysis')) return 'analysis';
    return 'config';
  }

  /**
   * Add item to pending sync queue
   */
  private addToPendingSync(key: string, item: StorageItem): void {
    if (typeof window === 'undefined') return;
    try {
      const queueKey = 'azure_pending_sync';
      const queue = JSON.parse(localStorage.getItem(queueKey) || '{}');
      queue[key] = item;
      localStorage.setItem(queueKey, JSON.stringify(queue));
      this.syncStatus.pendingCount = Object.keys(queue).length;
    } catch {
      // Ignore
    }
  }

  /**
   * Remove item from pending sync queue
   */
  private removeFromPendingSync(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      const queueKey = 'azure_pending_sync';
      const queue = JSON.parse(localStorage.getItem(queueKey) || '{}');
      delete queue[key];
      if (Object.keys(queue).length === 0) {
        localStorage.removeItem(queueKey);
      } else {
        localStorage.setItem(queueKey, JSON.stringify(queue));
      }
      this.syncStatus.pendingCount = Object.keys(queue).length;
    } catch {
      // Ignore
    }
  }

  /**
   * Sync all pending items to backend
   */
  async syncPendingItems(): Promise<{ synced: number; failed: number }> {
    if (typeof window === 'undefined') return { synced: 0, failed: 0 };

    const connected = await this.checkConnection();
    if (!connected) {
      return { synced: 0, failed: this.syncStatus.pendingCount };
    }

    try {
      const queueKey = 'azure_pending_sync';
      const queue = JSON.parse(localStorage.getItem(queueKey) || '{}');
      let synced = 0;
      let failed = 0;

      for (const [key, item] of Object.entries(queue)) {
        try {
          const storageItem = item as StorageItem;
          const response = await fetch(`${API_BASE_URL}/api/v1/storage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(this.getAuthToken() ? { 'Authorization': `Bearer ${this.getAuthToken()}` } : {}),
            },
            body: JSON.stringify({
              key,
              value: storageItem.value,
              user_id: storageItem.userId,
              metadata: storageItem.metadata,
            }),
          });

          if (response.ok) {
            this.removeFromPendingSync(key);
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      this.syncStatus.lastSyncAt = new Date().toISOString();
      this.syncStatus.pendingCount = failed;

      // Dispatch sync completed event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('azure_sync_completed', {
          detail: { synced, failed }
        }));
      }

      return { synced, failed };
    } catch (error) {
      console.error('Sync failed:', error);
      return { synced: 0, failed: this.syncStatus.pendingCount };
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Clear all local data (for logout)
   */
  clearAll(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      // Clear specific keys, not everything
      const keysToKeep = ['theme', 'cookieConsent'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

// Export singleton instance
export const azureStorage = new AzureStorageService();

// Export convenience functions
export const setStorageItem = azureStorage.setItem.bind(azureStorage);
export const getStorageItem = azureStorage.getItem.bind(azureStorage);
export const removeStorageItem = azureStorage.removeItem.bind(azureStorage);
export const getAuditLogs = azureStorage.getAuditLogs.bind(azureStorage);
export const exportAuditLogs = azureStorage.exportAuditLogs.bind(azureStorage);
export const syncPendingItems = azureStorage.syncPendingItems.bind(azureStorage);
export const getSyncStatus = azureStorage.getSyncStatus.bind(azureStorage);
