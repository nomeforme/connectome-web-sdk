/**
 * WebSocket protocol types shared between @connectome/web-sdk and web-axon.
 *
 * Client ↔ Server message contract.
 */

// ─── Client → Server ─────────────────────────────────────────────────────────

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

/**
 * Client-side attachment shape. Bytes may be sent inline as base64 `data`,
 * or omitted (metadata-only) for future direct-upload paths.
 */
export interface ClientAttachment {
  /** MIME type (e.g. `text/plain`). Used by axon effectors to route the file. */
  contentType?: string;
  /** Original filename (extension used as fallback for content-type). */
  filename?: string;
  /** Byte length. */
  size?: number;
  /** Base64-encoded bytes. */
  data?: string;
}

export interface ClientMessage {
  type: 'message';
  streamId: string;
  content: string;
  /** Bot names this message @-mentions (triggers activation) */
  mentions?: string[];
  /** Optional file attachments carried with the message. */
  attachments?: ClientAttachment[];
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

/**
 * React to a message. Currently a single-purpose channel — the connectome
 * server only acts on `🫥` (U+1FAE5) reactions, which hide the target
 * message from LLM context. Other emojis are accepted but ignored server-side
 * (extension point for future reaction-driven behaviors).
 *
 * `facetId` is the VEIL facet ID of the target message (surfaced back to
 * clients on `message_ack`). `added=false` removes the reaction.
 */
export interface ClientReact {
  type: 'react';
  streamId: string;
  facetId: string;
  emoji: string;
  added: boolean;
}

export type ClientPayload =
  | ClientConnect
  | ClientCreateStream
  | ClientJoinStream
  | ClientLeaveStream
  | ClientMessage
  | ClientTyping
  | ClientGetHistory
  | ClientListStreams
  | ClientSetAmbient
  | ClientReact;

// ─── Server → Client ─────────────────────────────────────────────────────────

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
  /** VEIL facet ID for this speech — pass to `react` to target it. */
  facetId?: string;
  /** Attachments delivered alongside speech (blob refs / inline data / URLs). */
  attachments?: any[];
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
  /** VEIL facet ID for this message — pass to `react` to target it. */
  facetId?: string;
}

export interface ServerMessageAck {
  type: 'message_ack';
  streamId: string;
  /** The VEIL sequence number assigned to this message */
  sequence: number;
  /** VEIL facet ID assigned to the ack'd message — pass to `react` to target it. */
  facetId?: string;
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

export type ServerPayload =
  | ServerWelcome
  | ServerStreamCreated
  | ServerStreamJoined
  | ServerSpeech
  | ServerUserMessage
  | ServerTyping
  | ServerTypingStop
  | ServerAgents
  | ServerError
  | ServerMessageAck
  | ServerHistory
  | ServerStreamList;

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface AgentInfo {
  name: string;
  agentName?: string;
  online: boolean;
}
