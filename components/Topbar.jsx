'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function Topbar({ breadcrumbs = [], user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // ignore
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <header className="bg-white border-b border-[#D9DEE5] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm min-w-0 mr-2 overflow-x-auto whitespace-nowrap py-1">
        <ol className="flex items-center space-x-1.5 sm:space-x-2 text-[#4A5565]">
          <li>
            <Link href="/" className="hover:text-[#13315C] transition-colors shrink-0">
              Beranda
            </Link>
          </li>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <li aria-hidden="true" className="shrink-0">/</li>
              <li className={`shrink-0 ${idx === breadcrumbs.length - 1 ? 'font-semibold text-[#0B2545]' : ''}`}>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#13315C] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {/* Right controls: Date & Notification */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden md:block text-xs font-medium text-[#4A5565]">
          Senin, 16 November 2026
        </div>

        {/* Notification Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded border border-[#D9DEE5] bg-white flex items-center justify-center text-[#13315C] hover:bg-[#F1F3F6] relative transition-colors focus-visible:outline-2 focus-visible:outline-[#13315C]"
            aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
            aria-expanded={showNotifications}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 bg-[#991B1B] rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notification dropdown panel */}
          {showNotifications && (
            <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-14 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white rounded-md shadow-xl border border-[#D9DEE5] py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#E6EAF0]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[#0B2545]">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] rounded">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-[#13315C] hover:underline font-medium"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#E6EAF0]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#4A5565]">
                    Belum ada notifikasi saat ini.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs ${
                        !n.is_read ? 'bg-[#FBFAF7]' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-[#0B2545]">{n.judul}</p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#13315C] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[#334155] mt-1">{n.pesan}</p>
                      {n.tautan && (
                        <Link
                          href={n.tautan}
                          onClick={() => setShowNotifications(false)}
                          className="text-[#13315C] font-medium mt-1.5 inline-block hover:underline"
                        >
                          Lihat Rincian &rarr;
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
