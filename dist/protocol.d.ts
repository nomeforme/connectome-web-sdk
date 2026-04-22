/**
 * WebSocket protocol types shared between @connectome/web-sdk and web-axon.
 *
 * Client ↔ Server message contract.
 */
export interface ClientConnect {
    type: 'connect';
    userId: string;
    userName: string;
    /** Client application identifier (e.g. 'xenopoem'). Used to namespace streams. */
    clientApp?: string;
}
export interface ClientCreateStream {
    type: 'create_stream';
    /** Optional human-friendly name — server assigns the canonical streamId */
    name?: string;
}
export interface ClientJoinStream {
    type: 'join';
    streamId: string;
}
export interface ClientLeaveStream {
    type: 'leave';
    streamId: string;
}
export interface ClientMessage {
    type: 'message';
    streamId: string;
    content: string;
    /** Bot names this message @-mentions (triggers activation) */
    mentions?: string[];
}
export interface ClientTyping {
    type: 'typing';
    streamId: string;
}
export interface ClientGetHistory {
    type: 'get_history';
    streamId: string;
    /** Max messages to return (default 100) */
    limit?: number;
}
export interface ClientListStreams {
    type: 'list_streams';
}
export interface ClientSetAmbient {
    type: 'set_ambient';
    streamId: string;
    content: string;
    /** If set, only this agent sees the ambient facet in its system prompt */
    targetAgentId?: string;
}
export type ClientPayload = ClientConnect | ClientCreateStream | ClientJoinStream | ClientLeaveStream | ClientMessage | ClientTyping | ClientGetHistory | ClientListStreams | ClientSetAmbient;
export interface ServerWelcome {
    type: 'welcome';
    sessionId: string;
    agents: AgentInfo[];
}
export interface ServerStreamCreated {
    type: 'stream_created';
    streamId: string;
    name: string;
}
export interface ServerStreamJoined {
    type: 'stream_joined';
    streamId: string;
}
export interface ServerSpeech {
    type: 'speech';
    streamId: string;
    agentName: string;
    content: string;
    timestamp: number;
    /** True when the agent has more turns coming (still thinking) */
    cyclePending?: boolean;
}
export interface ServerTyping {
    type: 'typing';
    streamId: string;
    agentName: string;
}
export interface ServerTypingStop {
    type: 'typing_stop';
    streamId: string;
    agentName: string;
}
export interface ServerAgents {
    type: 'agents';
    agents: AgentInfo[];
}
export interface ServerError {
    type: 'error';
    message: string;
    code?: string;
}
export interface ServerUserMessage {
    type: 'user_message';
    streamId: string;
    userName: string;
    content: string;
    timestamp: number;
}
export interface ServerMessageAck {
    type: 'message_ack';
    streamId: string;
    /** The VEIL sequence number assigned to this message */
    sequence: number;
}
export interface HistoryMessage {
    author: string;
    content: string;
    timestamp: number;
    isAgent: boolean;
}
export interface ServerHistory {
    type: 'history';
    streamId: string;
    messages: HistoryMessage[];
}
export interface StreamListEntry {
    streamId: string;
    name: string;
}
export interface ServerStreamList {
    type: 'stream_list';
    streams: StreamListEntry[];
}
export type ServerPayload = ServerWelcome | ServerStreamCreated | ServerStreamJoined | ServerSpeech | ServerUserMessage | ServerTyping | ServerTypingStop | ServerAgents | ServerError | ServerMessageAck | ServerHistory | ServerStreamList;
export interface AgentInfo {
    name: string;
    agentName?: string;
    online: boolean;
}
//# sourceMappingURL=protocol.d.ts.map