import React, { useState } from 'react';
import { 
  MessageSquare, Bell, Send, User, ShieldAlert, BadgeCheck, 
  HelpCircle, Volume2, Sparkles, PhoneCall, Trash2, Eye
} from 'lucide-react';
import { Language, CleanerProfile, AppNotification } from '../types';
import { getTranslation } from '../locales';

interface NotificationsScreenProps {
  cleanerProfile: CleanerProfile;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  lang: Language;
  chatMessages: Array<{ sender: 'CLEANER' | 'SUPERVISOR'; text: string; time: string }>;
  onSendChatMessage: (text: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  cleanerProfile,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  lang,
  chatMessages,
  onSendChatMessage,
}) => {
  const t = getTranslation(lang);

  // States
  const [activeSegment, setActiveSegment] = useState<'CHAT' | 'PUSH'>('CHAT');
  const [typedMessage, setTypedMessage] = useState<string>('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    onSendChatMessage(typedMessage.trim());
    setTypedMessage('');
  };

  const getNotificationCategoryClass = (cat: string) => {
    switch (cat) {
      case 'NEW_ROOM': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'URGENT': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SUPERVISOR': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getNotificationCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'NEW_ROOM': return lang === 'RU' ? 'Новый номер' : 'New Room';
      case 'URGENT': return lang === 'RU' ? 'Срочно!' : 'Urgent';
      case 'SUPERVISOR': return lang === 'RU' ? 'Супервайзер' : 'Supervisor';
      default: return lang === 'RU' ? 'Система' : 'System';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="w-full bg-[#FAF7F3] h-full overflow-hidden flex flex-col font-sans">
      
      {/* 1. HEADER */}
      <div className="bg-[#241E1A] text-white p-5 space-y-3.5 border-b border-[#E7DFD5]/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#C2410C] text-white border border-white/10 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">{lang === 'RU' ? 'Чат и Уведомления' : 'Chat & Notifications'}</h1>
              <p className="text-xs text-[#8A8177] font-medium">{lang === 'RU' ? 'Связь с супервайзером и оповещения' : 'Shift messaging & push notifications feed'}</p>
            </div>
          </div>
        </div>

        {/* Segment selector */}
        <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setActiveSegment('CHAT')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSegment === 'CHAT' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{t.chatSupervisor}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSegment('PUSH')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeSegment === 'PUSH' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>{t.systemNotifications}</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 h-4 w-4 bg-rose-600 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. BODY CHAT SEGMENT */}
      {activeSegment === 'CHAT' ? (
        <div className="flex-1 flex flex-col min-h-[500px]">
          
          {/* Supervisor Card */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <img 
                src={cleanerProfile.supervisor.avatarUrl} 
                alt={cleanerProfile.supervisor.name} 
                className="h-10 w-10 object-cover rounded-full border border-slate-200" 
              />
              <div>
                <h4 className="text-xs font-black text-slate-800 leading-tight">
                  {cleanerProfile.supervisor.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  {t.supervisorRoleText} • {cleanerProfile.supervisor.phone}
                </p>
              </div>
            </div>

            <a 
              href={`tel:${cleanerProfile.supervisor.phone}`}
              className="h-9 w-9 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-slate-200 hover:border-sky-200"
            >
              <PhoneCall className="h-4 w-4" />
            </a>
          </div>

          {/* Messages list (Scrollable) */}
          <div className="flex-1 bg-slate-100/50 p-4 space-y-3 overflow-y-auto min-h-[300px] flex flex-col justify-end">
            <div className="space-y-3 overflow-y-auto max-h-[380px] no-scrollbar">
              {chatMessages.map((msg, index) => {
                const isCleaner = msg.sender === 'CLEANER';
                return (
                  <div 
                    key={index}
                    className={`flex ${isCleaner ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-xs text-xs space-y-0.5 ${
                      isCleaner 
                        ? 'bg-sky-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                    }`}>
                      <p className="font-semibold leading-relaxed break-words">{msg.text}</p>
                      <span className={`text-[9px] block text-right font-mono ${
                        isCleaner ? 'text-sky-200' : 'text-slate-400'
                      }`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form message input */}
          <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-200 p-3.5 flex items-center gap-2.5">
            <input
              type="text"
              placeholder={t.chatPlaceholder}
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="h-10 w-10 bg-sky-600 hover:bg-sky-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md shadow-sky-600/10 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        /* 3. PUSH NOTIFICATIONS SEGMENT */
        <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
          
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              {t.pushFeed}
            </span>

            {unreadCount > 0 && (
              <button 
                onClick={onMarkAllNotificationsAsRead}
                className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{lang === 'RU' ? 'Прочитать все' : 'Mark all as read'}</span>
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
              <Bell className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">{lang === 'RU' ? 'История уведомлений пуста' : 'Notification history is empty'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onMarkNotificationAsRead(item.id)}
                  className={`bg-white rounded-2xl border p-3.5 space-y-2 shadow-xs transition-colors cursor-pointer ${
                    item.isRead ? 'border-slate-200/80 bg-white/70' : 'border-sky-300 bg-sky-50/20 ring-1 ring-sky-300/30'
                  }`}
                >
                  {/* Category and timestamp */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded ${getNotificationCategoryClass(item.category)}`}>
                      {getNotificationCategoryLabel(item.category)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                  </div>

                  {/* Message body */}
                  <p className={`text-xs font-semibold text-slate-700 leading-relaxed ${
                    item.isRead ? 'text-slate-500 font-medium' : 'text-slate-900 font-bold'
                  }`}>
                    {lang === 'RU' ? item.messageRu : item.messageEn}
                  </p>
                  
                  {/* Unread circle badge */}
                  {!item.isRead && (
                    <div className="flex justify-end pt-1">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
