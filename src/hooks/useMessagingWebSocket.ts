import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { store } from '../store';
import {
  setConnectionStatus,
  addMessage,
  incrementConversationUnread,
  updateMessageReaction,
} from '../store/messaging/messagingSlice';
import { fetchConversations } from '../store/messaging/messagingThunks';
import { getMessagingWebSocketUrl } from '../services/messageService';
import { getStoredToken } from '../utils/tokenUtils';
import type { MessageItem } from '../services/messageService';

interface WsMessage {
  type: string;
  data?: MessageItem | ReactionPayload;
  timestamp?: string;
}

interface ReactionPayload {
  conversationId: string;
  messageId: string;
  emoji: string;
  add: boolean;
  userId: string;
}


/** Play a short notification sound (e.g. when new message arrives and widget is closed) */
function playNotificationSound(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore
  }
}

export function useMessagingWebSocket(active: boolean, widgetClosedWhenMessageArrives?: boolean) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetClosedRef = useRef(widgetClosedWhenMessageArrives);
  widgetClosedRef.current = widgetClosedWhenMessageArrives;

  const activeRef = useRef(active);
  const isAuthRef = useRef(isAuthenticated);
  activeRef.current = active;
  isAuthRef.current = isAuthenticated;

  const handleReactionMessage = useCallback(
    (data: ReactionPayload) => {
      const state = store.getState();
      const currentUserId = state.auth.user?.id;
      if (data.userId === currentUserId) return; // already updated locally
      dispatch(
        updateMessageReaction({
          conversationId: data.conversationId,
          messageId: data.messageId,
          emoji: data.emoji,
          add: data.add,
        })
      );
      if (widgetClosedRef.current) {
        playNotificationSound();
        dispatch(fetchConversations());
      } else if (state.messaging.activeConversationId !== data.conversationId) {
        dispatch(incrementConversationUnread(data.conversationId));
      }
    },
    [dispatch]
  );

  const connect = useCallback(() => {
    const token = getStoredToken();
    if (!token || !activeRef.current) return;

    const url = getMessagingWebSocketUrl(token);
    dispatch(setConnectionStatus('connecting'));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        dispatch(setConnectionStatus('connected'));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          if (msg.type === 'message' && msg.data && 'id' in msg.data) {
            const payload = msg.data as MessageItem;
            const hadConv = store.getState().messaging.conversations.some((c) => c.id === payload.conversationId);
            dispatch(
              addMessage({
                id: payload.id,
                conversationId: payload.conversationId,
                senderId: payload.senderId,
                content: payload.content,
                createdAt: payload.createdAt,
                sender: payload.sender,
              })
            );
            if (!hadConv) {
              void dispatch(fetchConversations());
            }
            const state = store.getState();
            const currentUserId = state.auth.user?.id;
            const isFromOther = currentUserId && payload.senderId !== currentUserId;
            if (isFromOther) {
              const viewingConversation = state.messaging.activeConversationId === payload.conversationId;
              if (!viewingConversation) {
                dispatch(incrementConversationUnread(payload.conversationId));
              }
              if (widgetClosedRef.current) {
                playNotificationSound();
                dispatch(fetchConversations());
              }
            }
          } else if (msg.type === 'message_reaction' && msg.data) {
            handleReactionMessage(msg.data as ReactionPayload);
          }
          // message_star: starredByMe is per-user, no need to update from others
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        dispatch(setConnectionStatus('disconnected'));
        wsRef.current = null;
        if (activeRef.current && isAuthRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        dispatch(setConnectionStatus('disconnected'));
      };
    } catch {
      dispatch(setConnectionStatus('disconnected'));
    }
  }, [dispatch, handleReactionMessage]);

  useEffect(() => {
    if (active && isAuthenticated) {
      connect();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      dispatch(setConnectionStatus('disconnected'));
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [active, isAuthenticated, connect, dispatch]);

  const send = useCallback(
    (conversationId: string, content: string) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'send_message',
            data: { conversationId, content },
          })
        );
      }
    },
    []
  );

  return { send };
}
