import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Collapse,
  Tooltip,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  TextField,
  InputAdornment,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  useTheme,
  Popover,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import { ChatBubble, Close, Edit, Send, EmojiEmotions, Mic, Stop, Pause, PlayArrow, Reply, ContentCopy, MoreVert, Star, StarBorder, Delete, Block, Search, Done, ErrorOutline, Replay, KeyboardArrowDown } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  createConversation,
  markAsRead,
  deleteConversation,
  blockUser,
  unblockUser,
} from '../../store/messaging/messagingThunks';
import { clearMessageCompose, markConversationRead, setActiveConversation, updateMessageReaction, updateMessageStar } from '../../store/messaging/messagingSlice';
import { messageService, type MessageItem } from '../../services/messageService';
import { useMessagingWebSocket } from '../../hooks/useMessagingWebSocket';
import ProfileAvatar from '../ui/ProfileAvatar';
import MessageContent, { PlatformLinkPreview, stripInlineFormat } from './MessageContent';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import {
  contentAssetService,
  uploadFileToPresignedUrl,
} from '../../services/contentAssetService';
import { showErrorToast } from '../../utils/notificationUtils';
import { useNavigate } from 'react-router-dom';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { format, isToday, differenceInDays } from 'date-fns';
import { userService } from '../../services/userService';
import type { Locale } from 'date-fns';
import { tr, enUS, de } from 'date-fns/locale';

const PANEL_WIDTH_DEFAULT = 840;
const PANEL_WIDTH_MIN = 560;
const PANEL_WIDTH_MAX = 1200;
const PANEL_HEIGHT_DEFAULT = 520;
const PANEL_HEIGHT_MIN = 420;
const PANEL_HEIGHT_MAX = 1050;
const CONVERSATIONS_WIDTH_DEFAULT = 260;
const CONVERSATIONS_WIDTH_MIN = 200;
const CONVERSATIONS_WIDTH_MAX = 480;
const VOICE_MAX_DURATION_SECONDS = 600; // 10 dakika

const dateLocales: Record<string, Locale> = { tr, en: enUS, de };

/**
 * Sağ alt köşede sabit mesajlaşma widget'ı.
 * Sol: konuşma listesi, sağ: mesajlaşma alanı.
 */
const MessagingWidget: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((s) => s.language);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const currentUserId = user?.id ?? '';
  const {
    conversations,
    messagesByConversation,
    paginationByConversation,
    activeConversationId,
    loading,
    loadingMessages,
    loadingMoreMessages,
    connectionStatus,
    pendingCompose,
  } = useAppSelector((s) => s.messaging);

  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; name: string; profile_image: string }>>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState<{ id: string; name: string; profile_image: string } | null>(null);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [pendingVoiceContent, setPendingVoiceContent] = useState<string | null>(null);
  const [pendingVoiceDurationSeconds, setPendingVoiceDurationSeconds] = useState<number>(0);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [attachedMention, setAttachedMention] = useState<{ questionId: string; answerId?: string; commentId?: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<{ el: HTMLElement; message: typeof activeMessages[0] } | null>(null);
  const [reactionPickerAnchor, setReactionPickerAnchor] = useState<{ el: HTMLElement; message: typeof activeMessages[0] } | null>(null);
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [convMenuAnchor, setConvMenuAnchor] = useState<HTMLElement | null>(null);
  const [convListContextMenu, setConvListContextMenu] = useState<{ mouseX: number; mouseY: number; conversationId: string } | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [failedMessages, setFailedMessages] = useState<Array<{ tempId: string; content: string; createdAt: string; conversationId: string }>>([]);
  const [globalSearchExpanded, setGlobalSearchExpanded] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchTextTriggered, setGlobalSearchTextTriggered] = useState(false);
  const [globalSearchVoiceOnly, setGlobalSearchVoiceOnly] = useState(false);
  const [globalSearchStarredOnly, setGlobalSearchStarredOnly] = useState(false);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [otherUserIsFollowing, setOtherUserIsFollowing] = useState<boolean | null>(null);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [panelHeight, setPanelHeight] = useState(PANEL_HEIGHT_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);
  const [conversationsWidth, setConversationsWidth] = useState(CONVERSATIONS_WIDTH_DEFAULT);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const resizeWidthStartRef = useRef<{ x: number; width: number } | null>(null);
  const [panelWidth, setPanelWidth] = useState(PANEL_WIDTH_DEFAULT);
  const [isResizingPanelWidth, setIsResizingPanelWidth] = useState(false);
  const resizePanelWidthStartRef = useRef<{ x: number; width: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Scroll-to-message hedefi; alta kaydırma ile yarışmasın diye ref olarak da tutulur */
  const pendingScrollToMessageIdRef = useRef<string | null>(null);
  const fetchMessagesLimitRef = useRef(15);
  const scrollHeightBeforeLoadMoreRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const cancelRecordingRef = useRef(false);
  const recordingSecondsRef = useRef(0);
  const messageInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const applyingComposeRef = useRef(false);
  const { send: wsSend } = useMessagingWebSocket(isAuthenticated, !open);

  const handleFormatClick = (wrap: { before: string; after: string }) => {
    const el = messageInputRef.current;
    if (!el || !('selectionStart' in el)) return;
    const start = (el as HTMLTextAreaElement).selectionStart ?? 0;
    const end = (el as HTMLTextAreaElement).selectionEnd ?? 0;
    const { value } = el;
    const selected = value.slice(start, end);
    const newText =
      value.slice(0, start) +
      wrap.before +
      selected +
      wrap.after +
      value.slice(end);
    setMessageInput(newText);
    setTimeout(() => {
      const newEl = messageInputRef.current;
      if (newEl && 'setSelectionRange' in newEl) {
        const newStart = start + wrap.before.length;
        const newEnd = selected ? end + wrap.before.length : newStart;
        (newEl as HTMLTextAreaElement).setSelectionRange(newStart, newEnd);
        newEl.focus();
      }
    }, 0);
  };

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchConversations());
    }
  }, [open, isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || open) return;
    const interval = setInterval(() => {
      dispatch(fetchConversations());
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, open, dispatch]);

  useEffect(() => {
    if (chatOpen && chatOpen !== 'new') {
      const limit = fetchMessagesLimitRef.current;
      fetchMessagesLimitRef.current = 15;
      dispatch(fetchMessages({ conversationId: chatOpen, page: 1, limit }));
      dispatch(markAsRead(chatOpen));
      setConversationSearchQuery('');
      setSearchExpanded(false);
    }
  }, [chatOpen, dispatch]);

  const globalSearchFetchedRef = useRef(false);
  useEffect(() => {
    if (!globalSearchExpanded) {
      globalSearchFetchedRef.current = false;
      return;
    }
    if (globalSearchFetchedRef.current) return;
    globalSearchFetchedRef.current = true;
    setGlobalSearchLoading(true);
    const convIds = conversations.map((c) => c.id);
    const loadedIds = Object.keys(messagesByConversation);
    const toFetch = convIds.filter((id) => !loadedIds.includes(id));
    if (toFetch.length === 0) {
      setGlobalSearchLoading(false);
      return;
    }
    Promise.all(toFetch.map((id) => dispatch(fetchMessages({ conversationId: id, page: 1, limit: 100 }))))
      .finally(() => setGlobalSearchLoading(false));
  }, [globalSearchExpanded, conversations, messagesByConversation, dispatch]);

  useEffect(() => {
    if (!userSearchQuery || userSearchQuery.length < 2) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const users = await messageService.searchUsers(userSearchQuery, 10);
        setUserSearchResults(users);
      } catch {
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const scrollMessageIntoView = (messageId: string): boolean => {
    const container = messagesScrollRef.current;
    const el = container?.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null
      ?? document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
    if (!el) return false;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset =
        elRect.top - containerRect.top - container.clientHeight / 2 + elRect.height / 2;
      container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return true;
  };

  useEffect(() => {
    const targetId = scrollToMessageId ?? pendingScrollToMessageIdRef.current;
    if (!targetId || !chatOpen || chatOpen === 'new') return;
    if (loadingMessages || loadingMoreMessages) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const tryScroll = () => {
      if (cancelled) return;
      const ok = scrollMessageIntoView(targetId);
      if (ok) {
        pendingScrollToMessageIdRef.current = null;
        setScrollToMessageId(null);
        setHighlightedMessageId(targetId);
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedMessageId(null);
          highlightTimeoutRef.current = null;
        }, 3000);
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    // Layout otursun diye kısa gecikme + retry
    const t = setTimeout(() => {
      requestAnimationFrame(tryScroll);
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [scrollToMessageId, chatOpen, messagesByConversation, loadingMessages, loadingMoreMessages]);

  useEffect(() => {
    setShowScrollToBottom(false);
  }, [chatOpen]);

  useEffect(() => {
    if (!isResizing) return;
    const onMouseMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const delta = start.y - e.clientY;
      const next = Math.max(PANEL_HEIGHT_MIN, Math.min(PANEL_HEIGHT_MAX, start.height + delta));
      setPanelHeight(next);
    };
    const onMouseUp = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isResizingWidth) return;
    const onMouseMove = (e: MouseEvent) => {
      const start = resizeWidthStartRef.current;
      if (!start) return;
      const delta = e.clientX - start.x;
      const next = Math.max(CONVERSATIONS_WIDTH_MIN, Math.min(CONVERSATIONS_WIDTH_MAX, start.width + delta));
      setConversationsWidth(next);
    };
    const onMouseUp = () => {
      resizeWidthStartRef.current = null;
      setIsResizingWidth(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizingWidth]);

  const handleResizeWidthStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeWidthStartRef.current = { x: e.clientX, width: conversationsWidth };
    setIsResizingWidth(true);
  };

  useEffect(() => {
    if (!isResizingPanelWidth) return;
    const onMouseMove = (e: MouseEvent) => {
      const start = resizePanelWidthStartRef.current;
      if (!start) return;
      const delta = start.x - e.clientX;
      const next = Math.max(PANEL_WIDTH_MIN, Math.min(PANEL_WIDTH_MAX, start.width + delta));
      setPanelWidth(next);
    };
    const onMouseUp = () => {
      resizePanelWidthStartRef.current = null;
      setIsResizingPanelWidth(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizingPanelWidth]);

  const handleResizePanelWidthStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizePanelWidthStartRef.current = { x: e.clientX, width: panelWidth };
    setIsResizingPanelWidth(true);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartRef.current = { y: e.clientY, height: panelHeight };
    setIsResizing(true);
  };

  const handleNewMessage = () => {
    setAttachedMention(null);
    setChatOpen('new');
    setNewMessageRecipient(null);
    setUserSearchQuery('');
    setPendingVoiceContent(null);
    setPendingVoiceDurationSeconds(0);
  };

  const clearConversationUnread = (id: string) => {
    dispatch(markConversationRead(id));
    dispatch(markAsRead(id));
  };

  const handleSelectConversation = (id: string) => {
    if (!applyingComposeRef.current) setAttachedMention(null);
    setChatOpen(id);
    setPendingVoiceContent(null);
    setPendingVoiceDurationSeconds(0);
    dispatch(setActiveConversation(id));
    clearConversationUnread(id);
  };

  const jumpToMessage = (conversationId: string, messageId: string) => {
    pendingScrollToMessageIdRef.current = messageId;
    setScrollToMessageId(messageId);
    setHighlightedMessageId(null);
    setConversationSearchQuery('');
    setSearchExpanded(false);
    setGlobalSearchTextTriggered(false);
    setGlobalSearchExpanded(false);
    setGlobalSearchVoiceOnly(false);

    const alreadyInDom =
      chatOpen === conversationId &&
      !!messagesScrollRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (alreadyInDom) {
      // Mesaj zaten listede — sadece kaydır/vurgula
      return;
    }

    fetchMessagesLimitRef.current = 100;
    if (chatOpen === conversationId) {
      // Aynı konuşmadaysa chatOpen effect tetiklenmez; daha geniş sayfa yükle
      dispatch(fetchMessages({ conversationId, page: 1, limit: 100 }));
      dispatch(markAsRead(conversationId));
    } else {
      handleSelectConversation(conversationId);
    }
  };

  const handleSelectUserForNewMessage = async (user: { id: string; name: string; profile_image: string } | null) => {
    if (!user) return;
    setNewMessageRecipient(user);
    try {
      const { id } = await dispatch(createConversation(user.id)).unwrap();
      setChatOpen(id);
      dispatch(setActiveConversation(id));
      dispatch(fetchConversations());
      dispatch(fetchMessages({ conversationId: id, page: 1, limit: 15 }));
    } catch {
      // Error handled by thunk
    }
  };

  useEffect(() => {
    if (!pendingCompose) return;
    const request = pendingCompose;
    dispatch(clearMessageCompose());
    applyingComposeRef.current = true;
    setOpen(true);
    setAttachedMention(
      request.questionId
        ? { questionId: request.questionId, answerId: request.answerId, commentId: request.commentId }
        : null
    );
    setMessageInput('');
    const existing = conversations.find(conversation => conversation.otherUser.id === request.recipient.id);
    if (existing) {
      handleSelectConversation(existing.id);
    } else {
      void handleSelectUserForNewMessage({
        id: request.recipient.id,
        name: request.recipient.name,
        profile_image: request.recipient.profile_image ?? '',
      });
    }
    applyingComposeRef.current = false;
  }, [pendingCompose]);

  const handleSendMessage = async (contentToSend?: string) => {
    const textPart = (contentToSend ?? messageInput).trim();
    const voicePart = pendingVoiceContent;
    const mentionUrl = attachedMention
      ? `${window.location.origin}/questions/${attachedMention.questionId}${
          attachedMention.commentId
            ? `#comment-${attachedMention.commentId}`
            : attachedMention.answerId
              ? `#answer-${attachedMention.answerId}`
              : ''
        }`
      : '';
    let content = '';
    if (voicePart && textPart) {
      content = `${voicePart}\n\n${textPart}`;
    } else if (voicePart) {
      content = voicePart;
    } else {
      content = textPart;
    }
    if (mentionUrl) {
      content = content ? `${mentionUrl}\n${content}` : mentionUrl;
    }
    if (!content || !chatOpen || chatOpen === 'new') return;
    setAttachedMention(null);
    if (replyingTo) {
      const preview = replyingTo.content.replace(/\n/g, ' ').slice(0, 100);
      content = `[reply:${replyingTo.id}]\n${replyingTo.senderName}: ${preview}\n\n${content}`;
      setReplyingTo(null);
    }
    setPendingVoiceContent(null);
    if (connectionStatus === 'connected') {
      wsSend(chatOpen, content);
      setMessageInput('');
    } else {
      try {
        await dispatch(sendMessage({ conversationId: chatOpen, content })).unwrap();
        setMessageInput('');
      } catch {
        const tempId = `failed-${Date.now()}`;
        setFailedMessages((prev) => [
          ...prev,
          { tempId, content, createdAt: new Date().toISOString(), conversationId: chatOpen },
        ]);
        showErrorToast(t('error', currentLanguage));
      }
    }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleResendMessage = async (failed: { tempId: string; content: string; conversationId: string }) => {
    try {
      await dispatch(sendMessage({ conversationId: failed.conversationId, content: failed.content })).unwrap();
      setFailedMessages((prev) => prev.filter((f) => f.tempId !== failed.tempId));
    } catch {
      showErrorToast(t('error', currentLanguage));
    }
  };

  const handleCopyMessage = async (m: { id: string; content: string }) => {
    const text = m.content.startsWith('[voice]')
      ? t('voice_message', currentLanguage)
      : m.content.replace(/\[reply:[^\]]+\]\n[^\n]+\n\n/g, '');
    await navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!chatOpen || chatOpen === 'new') return;
    const msg = activeMessages.find((x) => x.id === messageId);
    const reactedByMe = msg?.reactions?.find((r) => r.emoji === emoji)?.reactedByMe;
    try {
      if (reactedByMe) {
        await messageService.removeReaction(chatOpen, messageId, emoji);
        dispatch(updateMessageReaction({ conversationId: chatOpen, messageId, emoji, add: false }));
      } else {
        await messageService.addReaction(chatOpen, messageId, emoji);
        dispatch(updateMessageReaction({ conversationId: chatOpen, messageId, emoji, add: true }));
      }
    } catch {
      showErrorToast(t('error', currentLanguage));
    }
    setReactionPickerAnchor(null);
  };

  const handleToggleStar = async (messageId: string) => {
    if (!chatOpen || chatOpen === 'new') return;
    try {
      const { starred } = await messageService.toggleStar(chatOpen, messageId);
      dispatch(updateMessageStar({ conversationId: chatOpen, messageId, starred }));
    } catch {
      showErrorToast(t('error', currentLanguage));
    }
    setMessageMenuAnchor(null);
  };

  const handleReplyToMessage = (m: { id: string; content: string; senderId: string; sender?: { name: string } }) => {
    const senderName = m.senderId === currentUserId ? t('you', currentLanguage) : (m.sender?.name ?? activeConversation?.otherUser.name ?? '');
    const displayContent = m.content.startsWith('[voice]') ? t('voice_message', currentLanguage) : m.content.replace(/\[reply:[^\]]+\]\n[^\n]+\n\n/g, '').slice(0, 80);
    setReplyingTo({ id: m.id, content: displayContent, senderName });
  };

  const handleEmojiClick = (data: EmojiClickData) => {
    setMessageInput((prev) => prev + data.emoji);
  };

  const clearRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    clearRecordingTimer();
    recordingStartTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      recordingSecondsRef.current = elapsed;
      setRecordingSeconds(elapsed);
    };
    tick();
    recordingIntervalRef.current = setInterval(tick, 500);
  };

  const handleVoiceRecordStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      cancelRecordingRef.current = false;
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const durationSeconds = Math.max(0, Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
        recordingSecondsRef.current = durationSeconds;
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        clearRecordingTimer();
        setIsRecording(false);
        setIsPaused(false);
        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
        mediaRecorderRef.current = null;

        if (cancelRecordingRef.current) return;

        if (durationSeconds > VOICE_MAX_DURATION_SECONDS) {
          showErrorToast(t('voice_max_duration', currentLanguage));
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 100 || !chatOpen || chatOpen === 'new') return;
        setVoiceUploading(true);
        try {
          const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
          const presigned = await contentAssetService.createPresignedUpload({
            type: 'message-voice',
            filename: `voice-${Date.now()}.${ext}`,
            mimeType,
            contentLength: blob.size,
            ownerId: currentUserId,
            visibility: 'private',
          });
          const file = new File([blob], presigned.key.split('/').pop() || `voice.${ext}`, {
            type: mimeType,
          });
          await uploadFileToPresignedUrl(presigned, file);
          setPendingVoiceContent(`[voice]key:${presigned.key}`);
          setPendingVoiceDurationSeconds(durationSeconds);
        } catch {
          // Error - user can retry
        } finally {
          setVoiceUploading(false);
        }
      };

      recorder.start(500);
      setIsRecording(true);
      startRecordingTimer();
    } catch {
      // Mic permission denied
    }
  };

  const handleVoiceRecordPause = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearRecordingTimer();
      setIsPaused(true);
    }
  };

  const handleVoiceRecordResume = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startRecordingTimer();
      setIsPaused(false);
    }
  };

  const handleVoiceRecordStop = () => {
    cancelRecordingRef.current = false;
    if (mediaRecorderRef.current?.state === 'recording' || mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceRecordCancel = () => {
    cancelRecordingRef.current = true;
    if (mediaRecorderRef.current?.state === 'recording' || mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMessagesScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isNearBottomRef.current = nearBottom;
    setShowScrollToBottom(!nearBottom);
    if (!chatOpen || !hasMoreMessages || loadingMoreMessages) return;
    if (el.scrollTop < 80) {
      scrollHeightBeforeLoadMoreRef.current = el.scrollHeight;
      dispatch(fetchMessages({
        conversationId: chatOpen,
        page: nextPage,
        limit: 15,
        append: true,
      }));
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const activeConversation = chatOpen && chatOpen !== 'new'
    ? conversations.find((c) => c.id === chatOpen)
    : null;
  const activeMessages = chatOpen ? messagesByConversation[chatOpen] ?? [] : [];

  const watchedUserId = chatOpen === 'new'
    ? newMessageRecipient?.id
    : activeConversation?.otherUser.id;

  useEffect(() => {
    if (!watchedUserId) {
      setOtherUserIsFollowing(null);
      return;
    }
    let cancelled = false;
    setOtherUserIsFollowing(null);
    userService.getUserById(watchedUserId).then((u) => {
      if (!cancelled) setOtherUserIsFollowing(u?.isFollowing ?? false);
    });
    return () => {
      cancelled = true;
    };
  }, [watchedUserId]);

  type VoiceMsgWithConv = MessageItem & { _conv: typeof conversations[0] };
  type TextMsgWithConv = MessageItem & { _conv: typeof conversations[0] };
  const isMessageStarred = (m: MessageItem) => Boolean((m as MessageItem & { starredByMe?: boolean }).starredByMe);
  const globalSearchVoiceMessages: VoiceMsgWithConv[] = (() => {
    if (!globalSearchVoiceOnly) return [];
    let list = conversations.flatMap((c) => {
      const msgs = messagesByConversation[c.id] ?? [];
      return msgs
        .filter((m) => m.content.startsWith('[voice]'))
        .map((m) => ({ ...m, _conv: c }));
    });
    if (globalSearchStarredOnly) list = list.filter(isMessageStarred);
    return list;
  })();
  const globalSearchTextQuery = globalSearchTextTriggered ? globalSearchQuery.trim() : '';
  const globalSearchMatchingMessages: TextMsgWithConv[] = (() => {
    if (globalSearchTextQuery.length < 2 || globalSearchVoiceOnly) return [];
    let list = conversations.flatMap((c) => {
      const msgs = messagesByConversation[c.id] ?? [];
      const q = globalSearchTextQuery.toLowerCase();
      return msgs
        .filter((m) => {
          const text = m.content.startsWith('[voice]') ? '' : m.content.replace(/\[reply:[^\]]+\]\n[^\n]+\n\n/g, '');
          return text.toLowerCase().includes(q);
        })
        .map((m) => ({ ...m, _conv: c }));
    });
    if (globalSearchStarredOnly) list = list.filter(isMessageStarred);
    return list;
  })();
  const globalSearchStarredOnlyMessages: TextMsgWithConv[] = (() => {
    if (!globalSearchStarredOnly || globalSearchVoiceOnly) return [];
    if (globalSearchTextTriggered && globalSearchTextQuery.length >= 2) return [];
    return conversations.flatMap((c) => {
      const msgs = messagesByConversation[c.id] ?? [];
      return msgs.filter(isMessageStarred).map((m) => ({ ...m, _conv: c }));
    });
  })();
  const showingStarredOnlyList = globalSearchStarredOnly && globalSearchExpanded && !globalSearchVoiceOnly && (!globalSearchTextTriggered || globalSearchTextQuery.length < 2);
  const filteredMessages = conversationSearchQuery.trim()
    ? activeMessages.filter((m) => {
        const text = m.content.startsWith('[voice]') ? '' : m.content.replace(/\[reply:[^\]]+\]\n[^\n]+\n\n/g, '');
        return text.toLowerCase().includes(conversationSearchQuery.trim().toLowerCase());
      })
    : activeMessages;
  const failedForConv = chatOpen ? failedMessages.filter((f) => f.conversationId === chatOpen) : [];
  const displayMessages = [
    ...filteredMessages.map((m) => ({ ...m, status: 'sent' as const })),
    ...failedForConv.map((f) => ({
      id: f.tempId,
      conversationId: f.conversationId,
      senderId: currentUserId,
      content: f.content,
      createdAt: f.createdAt,
      status: 'failed' as const,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const pagination = chatOpen ? paginationByConversation[chatOpen] : null;
  const hasMoreMessages = pagination?.hasNext ?? false;
  const nextPage = (pagination?.page ?? 1) + 1;
  const displayName = chatOpen === 'new'
    ? (newMessageRecipient?.name ?? t('new_message', currentLanguage))
    : activeConversation?.otherUser.name ?? '';

  const prevLoadingMessagesRef = useRef(false);
  const prevLoadingMoreMessagesRef = useRef(false);
  useEffect(() => {
    prevLastMessageIdRef.current = null;
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
  }, [chatOpen]);
  useEffect(() => {
    if (prevLoadingMessagesRef.current && !loadingMessages && activeMessages.length > 0) {
      // Arama sonucu mesaja gidiliyorsa alta kaydırma
      if (pendingScrollToMessageIdRef.current || scrollToMessageId) {
        prevLoadingMessagesRef.current = loadingMessages;
        return;
      }
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        isNearBottomRef.current = true;
        setShowScrollToBottom(false);
      });
    }
    prevLoadingMessagesRef.current = loadingMessages;
  }, [loadingMessages, activeMessages.length, scrollToMessageId]);
  useEffect(() => {
    if (prevLoadingMoreMessagesRef.current && !loadingMoreMessages && messagesScrollRef.current) {
      const el = messagesScrollRef.current;
      const addedHeight = el.scrollHeight - scrollHeightBeforeLoadMoreRef.current;
      el.scrollTop = addedHeight;
    }
    prevLoadingMoreMessagesRef.current = loadingMoreMessages;
  }, [loadingMoreMessages]);
  // Yeni mesaj geldiğinde (veya kullanıcı kendi mesajını gönderdiğinde) alta kaydır
  useEffect(() => {
    if (!chatOpen || chatOpen === 'new' || loadingMessages || loadingMoreMessages) return;
    if (pendingScrollToMessageIdRef.current || scrollToMessageId) return;
    const lastMsg = displayMessages[displayMessages.length - 1];
    if (!lastMsg) {
      prevLastMessageIdRef.current = null;
      return;
    }
    if (prevLastMessageIdRef.current === lastMsg.id) return;
    const isFirstSync = prevLastMessageIdRef.current === null;
    prevLastMessageIdRef.current = lastMsg.id;
    // İlk yükleme zaten loadingMessages effect'inde kaydırılıyor
    if (isFirstSync) return;
    const isOwnMessage = lastMsg.senderId === currentUserId;
    if (!isOwnMessage && !isNearBottomRef.current) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      isNearBottomRef.current = true;
      setShowScrollToBottom(false);
    });
  }, [displayMessages, chatOpen, loadingMessages, loadingMoreMessages, currentUserId, scrollToMessageId]);

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const locale = dateLocales[currentLanguage] ?? enUS;
      if (isToday(date)) {
        return format(date, 'HH:mm', { locale });
      }
      if (differenceInDays(Date.now(), date) < 7) {
        return format(date, 'EEE HH:mm', { locale });
      }
      return format(date, 'dd.MM.yyyy HH:mm', { locale });
    } catch {
      return dateStr;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      <Collapse in={open} timeout={300} sx={{ transformOrigin: 'bottom' }}>
        <Paper
          elevation={8}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: panelWidth,
            height: panelHeight,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            mb: 1,
          }}
        >
          <Box
            onMouseDown={handleResizePanelWidthStart}
            sx={{
              width: 6,
              flexShrink: 0,
              cursor: 'ew-resize',
              bgcolor: isResizingPanelWidth ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.selected' },
            }}
            title={t('resize_panel', currentLanguage)}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box
            onMouseDown={handleResizeStart}
            sx={{
              height: 6,
              cursor: 'ns-resize',
              flexShrink: 0,
              bgcolor: isResizing ? 'action.selected' : 'action.hover',
              borderBottom: `1px solid ${theme.palette.divider}`,
              '&:hover': { bgcolor: 'action.selected' },
            }}
            title={t('resize_panel', currentLanguage)}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.5,
              bgcolor: 'action.hover',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <ChatBubble color="primary" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
              {t('messages', currentLanguage)}
            </Typography>
            {connectionStatus === 'connected' && (
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} title="Connected" />
            )}
            <IconButton
              size="small"
              onClick={() => setGlobalSearchExpanded((prev) => !prev)}
              sx={{ color: globalSearchExpanded ? 'primary.main' : 'text.secondary' }}
              aria-label="search"
            >
              <Search sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => setOpen(false)} aria-label="close">
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Collapse in={globalSearchExpanded}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                placeholder={t('search_all_messages', currentLanguage)}
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setGlobalSearchTextTriggered(false);
                }}
                disabled={globalSearchVoiceOnly}
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalSearchQuery.trim().length >= 2 && !globalSearchVoiceOnly) {
                    setGlobalSearchTextTriggered(true);
                  }
                }}
                InputProps={{
                  endAdornment: !globalSearchVoiceOnly && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (globalSearchQuery.trim().length >= 2) setGlobalSearchTextTriggered(true);
                        }}
                        aria-label={t('search', currentLanguage)}
                      >
                        <Search sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={globalSearchVoiceOnly}
                      onChange={(e) => setGlobalSearchVoiceOnly(e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption">{t('voice_only', currentLanguage)}</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={globalSearchStarredOnly}
                      onChange={(e) => setGlobalSearchStarredOnly(e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption">{t('starred_only', currentLanguage)}</Typography>}
                />
              </Box>
            </Box>
          </Collapse>

          <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0 }}>
            <Box
              sx={{
                width: conversationsWidth,
                flexShrink: 0,
                minWidth: 0,
                minHeight: 0,
                borderRight: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                  {t('conversations', currentLanguage)}
                </Typography>
                <ListItemButton
                  onClick={handleNewMessage}
                  sx={{
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <Edit sx={{ mr: 1, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('new_message', currentLanguage)}
                  </Typography>
                </ListItemButton>
              </Box>
              <List disablePadding sx={{ flex: 1, minHeight: 0, overflowY: 'scroll', overflowX: 'hidden', ...getScrollbarSx(theme) }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (globalSearchVoiceOnly && globalSearchVoiceMessages.length === 0 && !globalSearchLoading) ||
                  (globalSearchTextTriggered && !globalSearchVoiceOnly && globalSearchMatchingMessages.length === 0) ||
                  (showingStarredOnlyList && globalSearchStarredOnlyMessages.length === 0 && !globalSearchLoading) ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {globalSearchVoiceOnly ? t('no_voice_messages', currentLanguage) : showingStarredOnlyList ? t('no_matching_messages', currentLanguage) : t('no_matching_messages', currentLanguage)}
                    </Typography>
                  </Box>
                ) : (
                  (globalSearchVoiceOnly && globalSearchVoiceMessages.length > 0
                    ? Array.from(new Map(globalSearchVoiceMessages.map((m) => [m._conv.id, m._conv])).values())
                    : globalSearchVoiceOnly
                      ? conversations.filter((c) => (messagesByConversation[c.id] ?? []).some((m) => m.content.startsWith('[voice]')))
                      : showingStarredOnlyList && globalSearchStarredOnlyMessages.length > 0
                        ? Array.from(new Map(globalSearchStarredOnlyMessages.map((m) => [m._conv.id, m._conv])).values())
                        : globalSearchTextTriggered && globalSearchMatchingMessages.length > 0
                          ? Array.from(new Map(globalSearchMatchingMessages.map((m) => [m._conv.id, m._conv])).values())
                          : conversations
                  ).map((c) => (
                    <ListItemButton
                      key={c.id}
                      selected={chatOpen === c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setConvListContextMenu({ mouseX: e.clientX, mouseY: e.clientY, conversationId: c.id });
                      }}
                      sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&.Mui-selected': { bgcolor: 'action.selected' },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <ProfileAvatar
                          key={`${c.otherUser.id}-${c.otherUser.profile_image}`}
                          src={c.otherUser.profile_image || undefined}
                          ownerId={c.otherUser.id}
                          fallbackName={c.otherUser.name}
                          sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0, fontSize: '0.8125rem' }}>
                              {c.otherUser.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.65rem' }}>
                              {c.lastMessage ? formatMessageTime(c.lastMessage.createdAt) : ''}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.25 }}>
                            {c.isBlockedByMe && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Block sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  {t('blocked', currentLanguage)}
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontSize: '0.75rem',
                                  fontStyle: c.lastMessage?.content?.startsWith('[voice]') ? 'italic' : undefined,
                                }}
                              >
                                {c.lastMessage?.content?.startsWith('[voice]')
                                  ? c.lastMessage.content.includes('\n\n')
                                    ? `${t('voice_message', currentLanguage)} • ${stripInlineFormat(c.lastMessage.content.slice(c.lastMessage.content.indexOf('\n\n') + 2).replace(/^\[reply:[^\]]+\]\n[^\n]+\n\n/, '')).slice(0, 40)}${stripInlineFormat(c.lastMessage.content.slice(c.lastMessage.content.indexOf('\n\n') + 2).replace(/^\[reply:[^\]]+\]\n[^\n]+\n\n/, '')).length > 40 ? '…' : ''}`
                                    : t('voice_message', currentLanguage)
                                  : stripInlineFormat((c.lastMessage?.content ?? '').replace(/^\[reply:[^\]]+\]\n[^\n]+\n\n/, ''))}
                              </Typography>
                              {c.unreadCount > 0 && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
              <Menu
                open={!!convListContextMenu}
                onClose={() => setConvListContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={
                  convListContextMenu
                    ? { top: convListContextMenu.mouseY, left: convListContextMenu.mouseX }
                    : undefined
                }
              >
                <MenuItem
                  onClick={async () => {
                    if (convListContextMenu) {
                      try {
                        await dispatch(deleteConversation(convListContextMenu.conversationId)).unwrap();
                        if (chatOpen === convListContextMenu.conversationId) setChatOpen(null);
                        setConvListContextMenu(null);
                      } catch {
                        showErrorToast(t('error', currentLanguage));
                      }
                    }
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                  {t('delete_conversation', currentLanguage)}
                </MenuItem>
                {convListContextMenu && (() => {
                  const conv = conversations.find((c) => c.id === convListContextMenu.conversationId);
                  return conv ? (
                    <MenuItem
                      key="block"
                      onClick={async () => {
                        if (convListContextMenu) {
                          try {
                            if (conv.isBlockedByMe) {
                              await dispatch(unblockUser(conv.otherUser.id)).unwrap();
                            } else {
                              await dispatch(blockUser(conv.otherUser.id)).unwrap();
                            }
                            setConvListContextMenu(null);
                          } catch {
                            showErrorToast(t('error', currentLanguage));
                          }
                        }
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <ListItemIcon><Block fontSize="small" /></ListItemIcon>
                      {conv.isBlockedByMe ? t('unblock', currentLanguage) : t('block_user', currentLanguage)}
                    </MenuItem>
                  ) : null;
                })()}
              </Menu>
            </Box>

            <Box
              onMouseDown={handleResizeWidthStart}
              sx={{
                width: 6,
                flexShrink: 0,
                cursor: 'ew-resize',
                bgcolor: isResizingWidth ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.selected' },
              }}
              title={t('resize_panel', currentLanguage)}
            />

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: chatOpen ? 'background.paper' : 'action.hover',
              }}
            >
              {globalSearchVoiceOnly && globalSearchExpanded ? (
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...getScrollbarSx(theme) }}>
                  {globalSearchLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : globalSearchVoiceMessages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('no_voice_messages', currentLanguage)}
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {globalSearchVoiceMessages.map((m) => (
                        <Box
                          key={m.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            border: `1px solid ${theme.palette.divider}`,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                          onClick={() => jumpToMessage(m._conv.id, m.id)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ProfileAvatar
                              src={m._conv.otherUser.profile_image || undefined}
                              ownerId={m._conv.otherUser.id}
                              fallbackName={m._conv.otherUser.name}
                              sx={{ width: 24, height: 24 }}
                            />
                            <Typography variant="caption" fontWeight={600}>
                              {m._conv.otherUser.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {formatMessageTime(m.createdAt)}
                            </Typography>
                          </Box>
                          <VoiceMessagePlayer content={m.content} style={{ maxWidth: '100%', height: 32 }} />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : showingStarredOnlyList ? (
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...getScrollbarSx(theme) }}>
                  {globalSearchLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : globalSearchStarredOnlyMessages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('no_matching_messages', currentLanguage)}
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {globalSearchStarredOnlyMessages.map((m) => (
                        <Box
                          key={m.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            border: `1px solid ${theme.palette.divider}`,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                          onClick={() => jumpToMessage(m._conv.id, m.id)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ProfileAvatar
                              src={m._conv.otherUser.profile_image || undefined}
                              ownerId={m._conv.otherUser.id}
                              fallbackName={m._conv.otherUser.name}
                              sx={{ width: 24, height: 24 }}
                            />
                            <Typography variant="caption" fontWeight={600}>
                              {m._conv.otherUser.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {formatMessageTime(m.createdAt)}
                            </Typography>
                          </Box>
                          <Box sx={{ px: 0.5 }}>
                            {m.content.startsWith('[voice]') ? (
                              <VoiceMessagePlayer content={m.content.includes('\n\n') ? m.content.slice(0, m.content.indexOf('\n\n')) : m.content} style={{ maxWidth: '100%', height: 32 }} />
                            ) : (
                              <MessageContent
                                content={m.content.includes('\n\n') ? m.content.slice(m.content.indexOf('\n\n') + 2) : m.content}
                                isOwn={m.senderId === currentUserId}
                                currentLanguage={currentLanguage}
                              />
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : globalSearchTextTriggered && globalSearchExpanded && !globalSearchVoiceOnly ? (
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, ...getScrollbarSx(theme) }}>
                  {globalSearchLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : globalSearchMatchingMessages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('no_matching_messages', currentLanguage)}
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {globalSearchMatchingMessages.map((m) => (
                        <Box
                          key={m.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            border: `1px solid ${theme.palette.divider}`,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                          onClick={() => jumpToMessage(m._conv.id, m.id)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ProfileAvatar
                              src={m._conv.otherUser.profile_image || undefined}
                              ownerId={m._conv.otherUser.id}
                              fallbackName={m._conv.otherUser.name}
                              sx={{ width: 24, height: 24 }}
                            />
                            <Typography variant="caption" fontWeight={600}>
                              {m._conv.otherUser.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {formatMessageTime(m.createdAt)}
                            </Typography>
                          </Box>
                          <Box sx={{ px: 0.5 }}>
                            <MessageContent
                              content={m.content}
                              isOwn={m.senderId === currentUserId}
                              currentLanguage={currentLanguage}
                              highlightTerm={globalSearchTextQuery || undefined}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : chatOpen ? (
                <>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        onClick={() => {
                          const userId = chatOpen === 'new' ? newMessageRecipient?.id : activeConversation?.otherUser.id;
                          if (userId) {
                            setOpen(false);
                            navigate(`/profile/${userId}`);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flex: 1,
                          minWidth: 0,
                          cursor: (chatOpen === 'new' ? newMessageRecipient?.id : activeConversation?.otherUser.id) ? 'pointer' : 'default',
                          '&:hover': (chatOpen === 'new' ? newMessageRecipient?.id : activeConversation?.otherUser.id)
                            ? { opacity: 0.85 }
                            : undefined,
                        }}
                      >
                        <ProfileAvatar
                          key={
                            chatOpen === 'new'
                              ? `new-${newMessageRecipient?.id}-${newMessageRecipient?.profile_image}`
                              : `active-${activeConversation?.otherUser.id}-${activeConversation?.otherUser.profile_image}`
                          }
                          src={
                            chatOpen === 'new'
                              ? newMessageRecipient?.profile_image
                              : activeConversation?.otherUser.profile_image
                          }
                          ownerId={
                            chatOpen === 'new'
                              ? newMessageRecipient?.id
                              : activeConversation?.otherUser.id
                          }
                          fallbackName={displayName}
                          sx={{ width: 28, height: 28, bgcolor: 'primary.main', flexShrink: 0 }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }} noWrap>
                            {displayName}
                          </Typography>
                          {chatOpen !== 'new' && otherUserIsFollowing === true && (
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 500 }}>
                              {t('following_this_user', currentLanguage)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {chatOpen !== 'new' && (
                        <>
                          <IconButton
                            size="small"
                            onClick={(e) => setConvMenuAnchor(e.currentTarget)}
                            sx={{ color: 'text.secondary', p: 0.5 }}
                          >
                            <MoreVert sx={{ fontSize: 20 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setSearchExpanded((prev) => !prev)}
                            sx={{
                              color: searchExpanded ? 'primary.main' : 'text.secondary',
                              p: 0.5,
                            }}
                          >
                            <Search sx={{ fontSize: 20 }} />
                          </IconButton>
                          <Menu
                            anchorEl={convMenuAnchor}
                            open={!!convMenuAnchor}
                            onClose={() => setConvMenuAnchor(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                          >
                            <MenuItem
                              onClick={async () => {
                                if (chatOpen) {
                                  try {
                                    await dispatch(deleteConversation(chatOpen)).unwrap();
                                    setChatOpen(null);
                                    setConvMenuAnchor(null);
                                  } catch {
                                    showErrorToast(t('error', currentLanguage));
                                  }
                                }
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                              {t('delete_conversation', currentLanguage)}
                            </MenuItem>
                            {activeConversation && (
                              <MenuItem
                                onClick={async () => {
                                  if (activeConversation) {
                                    try {
                                      if (activeConversation.isBlockedByMe) {
                                        await dispatch(unblockUser(activeConversation.otherUser.id)).unwrap();
                                      } else {
                                        await dispatch(blockUser(activeConversation.otherUser.id)).unwrap();
                                      }
                                      setConvMenuAnchor(null);
                                    } catch {
                                      showErrorToast(t('error', currentLanguage));
                                    }
                                  }
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <ListItemIcon><Block fontSize="small" /></ListItemIcon>
                                {activeConversation.isBlockedByMe ? t('unblock', currentLanguage) : t('block_user', currentLanguage)}
                              </MenuItem>
                            )}
                          </Menu>
                        </>
                      )}
                    </Box>
                    {chatOpen !== 'new' && (
                      <Collapse in={searchExpanded} sx={{ width: '100%' }}>
                        <TextField
                          size="small"
                          placeholder={t('search_in_conversation', currentLanguage)}
                          value={conversationSearchQuery}
                          onChange={(e) => setConversationSearchQuery(e.target.value)}
                          autoFocus
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'action.hover',
                              fontSize: '0.8125rem',
                            },
                          }}
                        />
                      </Collapse>
                    )}
                  </Box>
                  {otherUserIsFollowing === false && (
                    <Box
                      sx={{
                        px: 2,
                        py: 0.75,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.14)' : 'rgba(255, 193, 7, 0.28)',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {t('user_not_followed', currentLanguage)}
                      </Typography>
                    </Box>
                  )}

                  {chatOpen === 'new' ? (
                    <Box sx={{ p: 2 }}>
                      <Autocomplete
                        options={userSearchResults}
                        getOptionLabel={(opt) => opt.name}
                        loading={userSearchLoading}
                        inputValue={userSearchQuery}
                        onInputChange={(_, v) => setUserSearchQuery(v)}
                        onChange={(_, v) => handleSelectUserForNewMessage(v)}
                        ListboxProps={{ sx: { maxHeight: 280, ...getScrollbarSx(theme) } }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={t('search', currentLanguage)}
                            size="small"
                          />
                        )}
                        renderOption={(props, opt) => (
                          <li {...props} key={opt.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ProfileAvatar
                                key={`${opt.id}-${opt.profile_image}`}
                                src={opt.profile_image || undefined}
                                ownerId={opt.id}
                                fallbackName={opt.name}
                                sx={{ width: 24, height: 24 }}
                              />
                              {opt.name}
                            </Box>
                          </li>
                        )}
                      />
                      {!newMessageRecipient && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {t('coming_soon', currentLanguage)}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <Box
                        ref={messagesScrollRef}
                        onScroll={handleMessagesScroll}
                        onClick={() => {
                          if (chatOpen && chatOpen !== 'new') clearConversationUnread(chatOpen);
                        }}
                        sx={{
                          flex: 1,
                          minHeight: 0,
                          overflowY: 'scroll',
                          overflowX: 'hidden',
                          ...getScrollbarSx(theme),
                        }}
                      >
                        {loadingMessages ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                              justifyContent: 'flex-end',
                              minHeight: 'min-content',
                              p: 2,
                            }}
                          >
                          {loadingMoreMessages && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                              <CircularProgress size={20} />
                            </Box>
                          )}
                          {displayMessages.map((m) => {
                            const isOwn = m.senderId === currentUserId;
                            const isFailed = (m as { status?: string }).status === 'failed';
                            const replyToId = m.content.match(/^\[reply:([^\]]+)\]/)?.[1];
                            const isHighlighted = highlightedMessageId === m.id;
                            return (
                            <Box
                              key={m.id}
                              data-message-id={m.id}
                              onClick={() => {
                                if (chatOpen && chatOpen !== 'new') clearConversationUnread(chatOpen);
                              }}
                              sx={{
                                alignSelf: isOwn ? 'flex-end' : 'flex-start',
                                maxWidth: '75%',
                                position: 'relative',
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                color: isFailed ? 'error.dark' : isOwn ? 'primary.contrastText' : 'text.primary',
                                display: 'flex',
                                flexDirection: isFailed ? 'row' : 'column',
                                alignItems: isFailed ? 'flex-start' : 'flex-end',
                                gap: isFailed ? 1 : 0,
                                outline: isHighlighted ? (t) => `3px solid ${t.palette.warning.main}` : 'none',
                                outlineOffset: isHighlighted ? 2 : 0,
                                bgcolor: isHighlighted
                                  ? (t) => (isFailed ? `${t.palette.error.main}40` : isOwn ? t.palette.primary.dark : t.palette.action.selected)
                                  : isFailed ? (theme) => `${theme.palette.error.main}40` : isOwn ? 'primary.main' : 'action.hover',
                                transition: 'outline 0.2s ease, background-color 0.2s ease',
                              }}
                            >
                              {!isFailed && (
                                <Tooltip title={t('actions', currentLanguage)}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => setMessageMenuAnchor({ el: e.currentTarget, message: m })}
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      p: 0.25,
                                      color: 'inherit',
                                      opacity: 0.7,
                                      '&:hover': { opacity: 1 },
                                    }}
                                  >
                                    <MoreVert sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {isFailed && (
                                <Tooltip title={t('error', currentLanguage)}>
                                  <ErrorOutline sx={{ fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                                </Tooltip>
                              )}
                              <Box sx={{ flex: isFailed ? 1 : undefined, minWidth: isFailed ? 0 : undefined, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
                                <Box sx={{ pr: isFailed ? 0 : 2.5, width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {m.content.startsWith('[voice]') ? (
                                    <>
                                      <VoiceMessagePlayer
                                        content={m.content.includes('\n\n') ? m.content.slice(0, m.content.indexOf('\n\n')) : m.content}
                                        style={{ maxWidth: '100%', height: 32 }}
                                      />
                                      {m.content.includes('\n\n') && (
                                        <MessageContent
                                          content={m.content.slice(m.content.indexOf('\n\n') + 2)}
                                          isOwn={isOwn}
                                          currentLanguage={currentLanguage}
                                          highlightTerm={conversationSearchQuery.trim() || undefined}
                                          replyToMessageId={replyToId}
                                          onReplyPreviewClick={(id) => {
                                            pendingScrollToMessageIdRef.current = id;
                                            setScrollToMessageId(id);
                                          }}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <MessageContent
                                      content={m.content}
                                      isOwn={isOwn}
                                      currentLanguage={currentLanguage}
                                      highlightTerm={conversationSearchQuery.trim() || undefined}
                                      replyToMessageId={replyToId}
                                      onReplyPreviewClick={(id) => {
                                        pendingScrollToMessageIdRef.current = id;
                                        setScrollToMessageId(id);
                                      }}
                                    />
                                  )}
                                </Box>
                                {('reactions' in m && (m.reactions?.length ?? 0) > 0) && !isFailed && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mt: 0.5 }}>
                                    {m.reactions!.map((r: { emoji: string; count: number; reactedByMe?: boolean }) => (
                                      <Tooltip key={r.emoji} title={r.reactedByMe ? t('remove_reaction', currentLanguage) : ''}>
                                        <Box
                                          component="button"
                                          type="button"
                                          onClick={() => handleAddReaction(m.id, r.emoji)}
                                          sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.25,
                                            px: 0.5,
                                            py: 0.25,
                                            borderRadius: 1,
                                            border: 'none',
                                            bgcolor: isOwn
                                              ? (r.reactedByMe ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)')
                                              : (r.reactedByMe ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.08)'),
                                            color: 'inherit',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            '&:hover': {
                                              bgcolor: isOwn ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.12)',
                                            },
                                          }}
                                        >
                                          <span>{r.emoji}</span>
                                          {r.count > 1 && <span>{r.count}</span>}
                                        </Box>
                                      </Tooltip>
                                    ))}
                                  </Box>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.625rem' }}>
                                    {formatMessageTime(m.createdAt)}
                                  </Typography>
                                  {isOwn && !isFailed && (
                                    <Done sx={{ fontSize: 14, opacity: 0.8 }} />
                                  )}
                                  {isFailed && (
                                    <Box
                                      component="button"
                                      type="button"
                                      onClick={() => handleResendMessage({ tempId: m.id, content: m.content, conversationId: m.conversationId })}
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.25,
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: 1,
                                        border: 'none',
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                      }}
                                    >
                                      <Replay sx={{ fontSize: 14 }} />
                                      {t('resend', currentLanguage)}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          );
                          })}
                          <div ref={messagesEndRef} />
                          </Box>
                        )}
                      </Box>
                      {showScrollToBottom && chatOpen && chatOpen !== 'new' && !loadingMessages && (
                        <Tooltip title={t('scroll_to_bottom', currentLanguage)}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                              setShowScrollToBottom(false);
                            }}
                            sx={{
                              position: 'absolute',
                              bottom: 12,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              bgcolor: 'background.paper',
                              boxShadow: 2,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                            aria-label={t('scroll_to_bottom', currentLanguage)}
                          >
                            <KeyboardArrowDown />
                          </IconButton>
                        </Tooltip>
                      )}
                      </Box>
                      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        {activeConversation?.isBlockedByMe ? (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1.5,
                              py: 2,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {t('you_blocked_this_user', currentLanguage)}
                            </Typography>
                            <Box
                              component="button"
                              onClick={async () => {
                                if (activeConversation) {
                                  try {
                                    await dispatch(unblockUser(activeConversation.otherUser.id)).unwrap();
                                  } catch {
                                    showErrorToast(t('error', currentLanguage));
                                  }
                                }
                              }}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                border: `1px solid ${theme.palette.primary.main}`,
                                bgcolor: 'transparent',
                                color: 'primary.main',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                              }}
                            >
                              <Block sx={{ fontSize: 18 }} />
                              {t('unblock', currentLanguage)}
                            </Box>
                          </Box>
                        ) : (
                          <>
                        {replyingTo && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                              py: 1,
                              px: 1.5,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              borderLeft: 3,
                              borderColor: 'primary.main',
                            }}
                          >
                            <Reply sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                {replyingTo.senderName}
                              </Typography>
                              <Typography variant="caption" noWrap sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                                {replyingTo.content}
                              </Typography>
                            </Box>
                            <IconButton size="small" onClick={() => setReplyingTo(null)} sx={{ p: 0.25 }}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        {isRecording && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1.5,
                              py: 1,
                              px: 1.5,
                              borderRadius: 1,
                              bgcolor: 'error.light',
                              color: 'error.contrastText',
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 36, fontSize: '0.875rem' }}>
                              {formatRecordingTime(recordingSeconds)}
                            </Typography>
                            {isPaused ? (
                              <Tooltip title={t('resume', currentLanguage)}>
                                <IconButton size="small" onClick={handleVoiceRecordResume} sx={{ color: 'inherit' }}>
                                  <PlayArrow fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title={t('pause', currentLanguage)}>
                                <IconButton size="small" onClick={handleVoiceRecordPause} sx={{ color: 'inherit' }}>
                                  <Pause fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={t('send', currentLanguage)}>
                              <IconButton size="small" onClick={handleVoiceRecordStop} sx={{ color: 'inherit' }}>
                                <Stop fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('cancel', currentLanguage)}>
                              <IconButton size="small" onClick={handleVoiceRecordCancel} sx={{ color: 'inherit', ml: 'auto' }}>
                                <Close fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                        {attachedMention && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 0.5,
                              mb: 0.5,
                              p: 0.75,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <PlatformLinkPreview
                                questionId={attachedMention.questionId}
                                answerId={attachedMention.answerId}
                                commentId={attachedMention.commentId}
                                isOwn={false}
                                currentLanguage={currentLanguage}
                                compact
                              />
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => setAttachedMention(null)}
                              sx={{ color: 'text.secondary', p: 0.25 }}
                              aria-label={t('cancel', currentLanguage)}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        )}
                        {pendingVoiceContent && !isRecording && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              px: 2,
                              py: 1.5,
                              mb: 0.5,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              border: `1px solid ${theme.palette.divider}`,
                              minHeight: 48,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                              {t('voice_message', currentLanguage)}:
                            </Typography>
                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <VoiceMessagePlayer content={pendingVoiceContent} style={{ flex: 1, minWidth: 120, maxWidth: '100%', height: 36 }} />
                              {pendingVoiceDurationSeconds > 0 && (
                                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                  {formatRecordingTime(pendingVoiceDurationSeconds)}
                                </Typography>
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => { setPendingVoiceContent(null); setPendingVoiceDurationSeconds(0); }}
                              sx={{ color: 'text.secondary', p: 0.25 }}
                              aria-label={t('cancel', currentLanguage)}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, pb: 0.25 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => setEmojiAnchor(e.currentTarget)}
                              sx={{ color: 'text.secondary', p: 0.75 }}
                            >
                              <EmojiEmotions sx={{ fontSize: 20 }} />
                            </IconButton>
                            {!isRecording && (
                              <IconButton
                                size="small"
                                onClick={handleVoiceRecordStart}
                                disabled={voiceUploading || chatOpen === 'new'}
                                sx={{ color: 'text.secondary', p: 0.75 }}
                              >
                                {voiceUploading ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <Mic sx={{ fontSize: 20 }} />
                                )}
                              </IconButton>
                            )}
                          </Box>
                          <TextField
                            variant="outlined"
                            size="small"
                            multiline
                            minRows={1}
                            maxRows={3}
                            placeholder={t('new_message', currentLanguage)}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                                py: 0.5,
                                '& textarea': {
                                  overflowY: 'auto',
                                  fontSize: '0.875rem',
                                  lineHeight: 1.4,
                                  py: 0.25,
                                },
                              },
                            }}
                          />
                          <Box sx={{ flexShrink: 0, pb: 0.25 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleSendMessage()}
                              disabled={!messageInput.trim() && !pendingVoiceContent && !attachedMention}
                              sx={{ p: 0.75 }}
                            >
                              <Send sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Box>
                        </Box>
                        <Popover
                          open={!!emojiAnchor}
                          anchorEl={emojiAnchor}
                          onClose={() => setEmojiAnchor(null)}
                          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        >
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width={320}
                            height={360}
                          />
                        </Popover>
                        <Menu
                          open={!!messageMenuAnchor}
                          anchorEl={messageMenuAnchor?.el}
                          onClose={() => setMessageMenuAnchor(null)}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        >
                          <MenuItem
                            onClick={() => {
                              if (messageMenuAnchor) {
                                setReactionPickerAnchor({ el: messageMenuAnchor.el, message: messageMenuAnchor.message });
                              }
                              setMessageMenuAnchor(null);
                            }}
                          >
                            <ListItemIcon><EmojiEmotions fontSize="small" /></ListItemIcon>
                            <ListItemText>{t('react', currentLanguage)}</ListItemText>
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              if (messageMenuAnchor) handleToggleStar(messageMenuAnchor.message.id);
                            }}
                          >
                            <ListItemIcon>
                              {messageMenuAnchor?.message.starredByMe ? <Star fontSize="small" color="primary" /> : <StarBorder fontSize="small" />}
                            </ListItemIcon>
                            <ListItemText>{messageMenuAnchor?.message.starredByMe ? t('unstar', currentLanguage) : t('star', currentLanguage)}</ListItemText>
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              if (messageMenuAnchor) handleReplyToMessage(messageMenuAnchor.message);
                              setMessageMenuAnchor(null);
                            }}
                          >
                            <ListItemIcon><Reply fontSize="small" /></ListItemIcon>
                            <ListItemText>{t('reply', currentLanguage)}</ListItemText>
                          </MenuItem>
                          <MenuItem
                            onClick={async () => {
                              if (messageMenuAnchor) await handleCopyMessage(messageMenuAnchor.message);
                              setMessageMenuAnchor(null);
                            }}
                          >
                            <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
                            <ListItemText>{messageMenuAnchor && copiedId === messageMenuAnchor.message.id ? t('copied', currentLanguage) : t('copy', currentLanguage)}</ListItemText>
                          </MenuItem>
                          {messageMenuAnchor && messageMenuAnchor.message.senderId !== currentUserId && (() => {
                            const isBlocked = activeConversation?.otherUser.id === messageMenuAnchor.message.senderId && activeConversation?.isBlockedByMe;
                            return (
                              <MenuItem
                                onClick={async () => {
                                  if (messageMenuAnchor) {
                                    try {
                                      if (isBlocked) {
                                        await dispatch(unblockUser(messageMenuAnchor.message.senderId)).unwrap();
                                      } else {
                                        await dispatch(blockUser(messageMenuAnchor.message.senderId)).unwrap();
                                      }
                                      setMessageMenuAnchor(null);
                                    } catch {
                                      showErrorToast(t('error', currentLanguage));
                                    }
                                  }
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <ListItemIcon><Block fontSize="small" /></ListItemIcon>
                                <ListItemText>{isBlocked ? t('unblock', currentLanguage) : t('block_user', currentLanguage)}</ListItemText>
                              </MenuItem>
                            );
                          })()}
                        </Menu>
                        <Popover
                          open={!!reactionPickerAnchor}
                          anchorEl={reactionPickerAnchor?.el}
                          onClose={() => setReactionPickerAnchor(null)}
                          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        >
                          <Box sx={{ p: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {['👍', '❤️', '😄', '😮', '😢', '🙏'].map((emoji) => (
                              <IconButton
                                key={emoji}
                                size="small"
                                onClick={() => reactionPickerAnchor && handleAddReaction(reactionPickerAnchor.message.id, emoji)}
                                sx={{ fontSize: '1.25rem' }}
                              >
                                {emoji}
                              </IconButton>
                            ))}
                          </Box>
                        </Popover>
                          </>
                        )}
                      </Box>
                    </>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <ChatBubble sx={{ fontSize: 48, color: 'action.disabled' }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('conversations', currentLanguage)}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {t('new_message', currentLanguage)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          </Box>
        </Paper>
      </Collapse>

      <Tooltip title={t('messages', currentLanguage)}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setOpen((o) => !o)}
            size="large"
            sx={{
              width: 56,
              height: 56,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              boxShadow: theme.shadows[4],
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s',
            }}
          >
            <ChatBubble />
          </IconButton>
          {totalUnread > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                bgcolor: 'error.main',
                color: 'error.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Box>
          )}
        </Box>
      </Tooltip>
    </Box>
  );
};

export default MessagingWidget;
