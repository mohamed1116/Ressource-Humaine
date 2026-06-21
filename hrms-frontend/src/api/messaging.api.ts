import api from './axiosInstance';

export const getConversations = () =>
  api.get('/messaging/conversations/');

export const createConversation = (data: { conv_type: string; title?: string; participant_ids: string[] }) =>
  api.post('/messaging/conversations/', data);

export const getMessages = (convId: string) =>
  api.get(`/messaging/conversations/${convId}/messages/`);

export const sendMessage = (convId: string, body: string, replyTo?: string) =>
  api.post(`/messaging/conversations/${convId}/messages/`, { body, reply_to: replyTo });

export const sendMessageWithFiles = (convId: string, body: string, files: File[], replyTo?: string) => {
  const form = new FormData();
  form.append('body', body || ' ');
  if (replyTo) form.append('reply_to', replyTo);
  files.forEach(f => form.append('attachments', f));
  return api.post(`/messaging/conversations/${convId}/messages/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const editMessage = (msgId: string, body: string) =>
  api.patch(`/messaging/messages/${msgId}/`, { body });

export const toggleStar = (msgId: string, is_starred: boolean) =>
  api.patch(`/messaging/messages/${msgId}/`, { is_starred });

export const reactToMessage = (msgId: string, emoji: string) =>
  api.post(`/messaging/messages/${msgId}/react/`, { emoji });

export const archiveConversation = (convId: string, archived: boolean) =>
  api.patch(`/messaging/conversations/${convId}/`, { is_archived: archived });

export const pinConversation = (convId: string, pinned: boolean) =>
  api.patch(`/messaging/conversations/${convId}/`, { is_pinned: pinned });

export const muteConversation = (convId: string, muted: boolean) =>
  api.patch(`/messaging/conversations/${convId}/`, { is_muted: muted });

export const sendMessageWithFile = (convId: string, body: string, file: File) => {
  const form = new FormData();
  if (body.trim()) form.append('body', body);
  else form.append('body', ' ');
  form.append('attachment', file);
  return api.post(`/messaging/conversations/${convId}/messages/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteMessage = (msgId: string) =>
  api.delete(`/messaging/messages/${msgId}/`);

export const getUnreadMessagesCount = () =>
  api.get('/messaging/unread/');

export const searchUsers = (q: string) =>
  api.get('/messaging/users/', { params: { q } });

export const getAllUsers = () =>
  api.get('/messaging/users/all/');

export const findOrCreateDirect = (userId: string) =>
  api.post('/messaging/direct/', { user_id: userId });
