/**
 * @connectome/web-sdk — Lightweight WebSocket client for the web-axon.
 *
 * This is the "platform SDK" that web-axon wraps, analogous to discord.js
 * for discord-axon or signal-cli for signal-axon.
 */

import type {
  ClientPayload,
  ServerPayload,
  ServerWelcome,
  ServerStreamCreated,
  ServerSpeech,
  ServerTyping,
  ServerTypingStop,
  ServerError,
  ServerMessageAck,
  ServerStreamJoined,
  ServerAgents,
  ServerHistory,
  ServerStreamList,
  AgentInfo,
} from './protocol.js';

export type WebSdkEventMap = {
  welcome: ServerWelcome;
  stream_created: ServerStreamCreated;
  stream_joined: ServerStreamJoined;
  speech: ServerSpeech;
  typing: ServerTyping;
  typing_stop: ServerTypingStop;
  agents: ServerAgents;
  error: ServerError;
  message_ack: ServerMessageAck;
  history: ServerHistory;
  stream_list: ServerStreamList;
  connected: undefined;
  disconnected: { code: number; reason: string };
  reconnecting: { attempt: number };
};

type Listener<T> = (data: T) => void;

export interface ConnectomeWebClientConfig {
  /** WebSocket URL of the web-axon, e.g. ws://localhost:8080 */
  url: string;
  /** Unique user identifier */
  userId: string;
  /** Display name */
  userName: string;
  /** Client application name (e.g. 'xenopoem'). Namespaces streams as web:<clientApp>:... */
  clientApp?: string;
  /** Auto-reconnect (default true) */
  reconnect?: boolean;
  /** Base reconnect interval in ms (default 2000) */
  reconnectInterval?: number;
  /** Max reconnect attempts (-1 = infinite, default -1) */
  maxReconnectAttempts?: number;
}

export class ConnectomeWebClient {
  private config: Required<ConnectomeWebClientConfig>;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private listeners = new Map<string, Set<Listener<any>>>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private agents: AgentInfo[] = [];

  constructor(config: ConnectomeWebClientConfig) {
    this.config = {
      clientApp: 'web',
      reconnect: true,
      reconnectInterval: 2000,
      maxReconnectAttempts: -1,
      ...config,
    };
  }

  // ─── Connection ───────────────────────────────────────────────────────

  connect(): void {
    this.intentionalClose = false;
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.send({
        type: 'connect',
        userId: this.config.userId,
        userName: this.config.userName,
        clientApp: this.config.clientApp,
      });
      this.emit('connected', undefined as any);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: ServerPayload = JSON.parse(
          typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer),
        );
        this.handleMessage(msg);
      } catch {
        // Malformed message — ignore
      }
    };

    this.ws.onclose = (event) => {
      this.emit('disconnected', { code: event.code, reason: event.reason });
      if (!this.intentionalClose && this.config.reconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // Error will trigger onclose
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getAgents(): AgentInfo[] {
    return this.agents;
  }

  // ─── Actions ──────────────────────────────────────────────────────────

  createStream(name?: string): void {
    this.send({ type: 'create_stream', name });
  }

  joinStream(streamId: string): void {
    this.send({ type: 'join', streamId });
  }

  leaveStream(streamId: string): void {
    this.send({ type: 'leave', streamId });
  }

  sendMessage(streamId: string, content: string, mentions?: string[]): void {
    this.send({ type: 'message', streamId, content, mentions });
  }

  sendTyping(streamId: string): void {
    this.send({ type: 'typing', streamId });
  }

  getHistory(streamId: string, limit?: number): void {
    this.send({ type: 'get_history', streamId, limit });
  }

  listStreams(): void {
    this.send({ type: 'list_streams' });
  }

  // ─── Events ───────────────────────────────────────────────────────────

  on<K extends keyof WebSdkEventMap>(event: K, listener: Listener<WebSdkEventMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  off<K extends keyof WebSdkEventMap>(event: K, listener: Listener<WebSdkEventMap[K]>): void {
    this.listeners.get(event)?.delete(listener);
  }

  // ─── Internals ────────────────────────────────────────────────────────

  private send(payload: ClientPayload): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private emit<K extends keyof WebSdkEventMap>(event: K, data: WebSdkEventMap[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  private handleMessage(msg: ServerPayload): void {
    switch (msg.type) {
      case 'welcome':
        this.sessionId = msg.sessionId;
        this.agents = msg.agents;
        this.emit('welcome', msg);
        break;
      case 'agents':
        this.agents = msg.agents;
        this.emit('agents', msg);
        break;
      case 'stream_created':
        this.emit('stream_created', msg);
        break;
      case 'stream_joined':
        this.emit('stream_joined', msg);
        break;
      case 'speech':
        this.emit('speech', msg);
        break;
      case 'typing':
        this.emit('typing', msg);
        break;
      case 'typing_stop':
        this.emit('typing_stop', msg);
        break;
      case 'error':
        this.emit('error', msg);
        break;
      case 'message_ack':
        this.emit('message_ack', msg);
        break;
      case 'history':
        this.emit('history', msg);
        break;
      case 'stream_list':
        this.emit('stream_list', msg);
        break;
    }
  }

  private scheduleReconnect(): void {
    if (
      this.config.maxReconnectAttempts >= 0 &&
      this.reconnectAttempt >= this.config.maxReconnectAttempts
    ) {
      return;
    }

    this.reconnectAttempt++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempt - 1),
      30000,
    );

    this.emit('reconnecting', { attempt: this.reconnectAttempt });
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
