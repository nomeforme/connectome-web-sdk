/**
 * @connectome/web-sdk — Lightweight WebSocket client for the web-axon.
 *
 * This is the "platform SDK" that web-axon wraps, analogous to discord.js
 * for discord-axon or signal-cli for signal-axon.
 */
import type { ServerWelcome, ServerStreamCreated, ServerSpeech, ServerUserMessage, ServerTyping, ServerTypingStop, ServerError, ServerMessageAck, ServerStreamJoined, ServerAgents, ServerHistory, ServerStreamList, AgentInfo } from './protocol.js';
export type WebSdkEventMap = {
    welcome: ServerWelcome;
    stream_created: ServerStreamCreated;
    stream_joined: ServerStreamJoined;
    speech: ServerSpeech;
    user_message: ServerUserMessage;
    typing: ServerTyping;
    typing_stop: ServerTypingStop;
    agents: ServerAgents;
    error: ServerError;
    message_ack: ServerMessageAck;
    history: ServerHistory;
    stream_list: ServerStreamList;
    connected: undefined;
    disconnected: {
        code: number;
        reason: string;
    };
    reconnecting: {
        attempt: number;
    };
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
export declare class ConnectomeWebClient {
    private config;
    private ws;
    private sessionId;
    private listeners;
    private reconnectAttempt;
    private reconnectTimer;
    private intentionalClose;
    private agents;
    constructor(config: ConnectomeWebClientConfig);
    connect(): void;
    disconnect(): void;
    isConnected(): boolean;
    getSessionId(): string | null;
    getAgents(): AgentInfo[];
    createStream(name?: string): void;
    joinStream(streamId: string): void;
    leaveStream(streamId: string): void;
    sendMessage(streamId: string, content: string, mentions?: string[]): void;
    sendTyping(streamId: string): void;
    getHistory(streamId: string, limit?: number): void;
    listStreams(): void;
    setAmbient(streamId: string, content: string, targetAgentId?: string): void;
    on<K extends keyof WebSdkEventMap>(event: K, listener: Listener<WebSdkEventMap[K]>): () => void;
    off<K extends keyof WebSdkEventMap>(event: K, listener: Listener<WebSdkEventMap[K]>): void;
    private send;
    private emit;
    private handleMessage;
    private scheduleReconnect;
}
export {};
//# sourceMappingURL=client.d.ts.map