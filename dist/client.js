/**
 * @connectome/web-sdk — Lightweight WebSocket client for the web-axon.
 *
 * This is the "platform SDK" that web-axon wraps, analogous to discord.js
 * for discord-axon or signal-cli for signal-axon.
 */
export class ConnectomeWebClient {
    config;
    ws = null;
    sessionId = null;
    listeners = new Map();
    reconnectAttempt = 0;
    reconnectTimer = null;
    intentionalClose = false;
    agents = [];
    constructor(config) {
        this.config = {
            clientApp: 'web',
            reconnect: true,
            reconnectInterval: 2000,
            maxReconnectAttempts: -1,
            ...config,
        };
    }
    // ─── Connection ───────────────────────────────────────────────────────
    connect() {
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
            this.emit('connected', undefined);
        };
        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data));
                this.handleMessage(msg);
            }
            catch {
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
    disconnect() {
        this.intentionalClose = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.ws?.close();
        this.ws = null;
    }
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    getSessionId() {
        return this.sessionId;
    }
    getAgents() {
        return this.agents;
    }
    // ─── Actions ──────────────────────────────────────────────────────────
    createStream(name) {
        this.send({ type: 'create_stream', name });
    }
    joinStream(streamId) {
        this.send({ type: 'join', streamId });
    }
    leaveStream(streamId) {
        this.send({ type: 'leave', streamId });
    }
    sendMessage(streamId, content, mentions) {
        this.send({ type: 'message', streamId, content, mentions });
    }
    sendTyping(streamId) {
        this.send({ type: 'typing', streamId });
    }
    getHistory(streamId, limit) {
        this.send({ type: 'get_history', streamId, limit });
    }
    listStreams() {
        this.send({ type: 'list_streams' });
    }
    setAmbient(streamId, content, targetAgentId) {
        this.send({ type: 'set_ambient', streamId, content, targetAgentId });
    }
    // ─── Events ───────────────────────────────────────────────────────────
    on(event, listener) {
        if (!this.listeners.has(event))
            this.listeners.set(event, new Set());
        this.listeners.get(event).add(listener);
        return () => this.listeners.get(event)?.delete(listener);
    }
    off(event, listener) {
        this.listeners.get(event)?.delete(listener);
    }
    // ─── Internals ────────────────────────────────────────────────────────
    send(payload) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }
    emit(event, data) {
        this.listeners.get(event)?.forEach((fn) => fn(data));
    }
    handleMessage(msg) {
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
            case 'user_message':
                this.emit('user_message', msg);
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
    scheduleReconnect() {
        if (this.config.maxReconnectAttempts >= 0 &&
            this.reconnectAttempt >= this.config.maxReconnectAttempts) {
            return;
        }
        this.reconnectAttempt++;
        const delay = Math.min(this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempt - 1), 30000);
        this.emit('reconnecting', { attempt: this.reconnectAttempt });
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    }
}
//# sourceMappingURL=client.js.map