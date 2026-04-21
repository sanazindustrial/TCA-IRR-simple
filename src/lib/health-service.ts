/**
 * HealthService – singleton that keeps the backend warm and tracks liveness.
 *
 * Why this exists:
 *  - Azure App Service (Basic/Free tier) spins containers down after ~20 min of
 *    inactivity.  Pinging every 30 s prevents cold-start delays for real users.
 *  - Components can subscribe to status changes to show a live indicator.
 */

export type ServiceStatus = 'checking' | 'healthy' | 'degraded' | 'down';

type StatusListener = (status: ServiceStatus) => void;

const HEARTBEAT_MS = 30_000; // 30 seconds – keeps Azure container warm
const PING_TIMEOUT_MS = 8_000; // give the API 8 s to respond

class HealthService {
    private static _instance: HealthService | null = null;

    private readonly baseURL: string;
    private status: ServiceStatus = 'checking';
    private timerId: ReturnType<typeof setInterval> | null = null;
    private listeners: Set<StatusListener> = new Set();

    private constructor() {
        this.baseURL =
            process.env.NEXT_PUBLIC_API_URL ||
            'https://tcairrapiccontainer.azurewebsites.net';
    }

    static getInstance(): HealthService {
        if (!HealthService._instance) {
            HealthService._instance = new HealthService();
        }
        return HealthService._instance;
    }

    // ── Pub/sub ──────────────────────────────────────────────────────────────

    subscribe(listener: StatusListener): () => void {
        this.listeners.add(listener);
        // Immediately emit current status so new subscribers are up-to-date
        listener(this.status);
        return () => this.listeners.delete(listener);
    }

    getStatus(): ServiceStatus {
        return this.status;
    }

    private emit(status: ServiceStatus) {
        this.status = status;
        this.listeners.forEach((l) => l(status));
    }

    // ── Ping ─────────────────────────────────────────────────────────────────

    async ping(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                PING_TIMEOUT_MS
            );

            const res = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeoutId);

            this.emit(res.ok ? 'healthy' : 'degraded');
            return res.ok;
        } catch {
            this.emit('down');
            return false;
        }
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    /** Start the heartbeat loop.  Safe to call multiple times – only one timer runs. */
    start(): void {
        if (this.timerId !== null) return;
        // Ping immediately, then on each interval
        this.ping();
        this.timerId = setInterval(() => this.ping(), HEARTBEAT_MS);
    }

    /** Stop the heartbeat loop (e.g. on logout / unmount). */
    stop(): void {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
}

export const healthService = HealthService.getInstance();
