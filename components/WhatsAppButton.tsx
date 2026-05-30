"use client";

import { useState } from "react";

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348000000000";

  const messages = [
    "Hi! I'd like to know more about your diffusers 🤍",
    "I need help choosing a fragrance",
    "I have a question about my order",
    "I'd like to enquire about subscriptions",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Popup */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in mb-3">
          {/* Header */}
          <div className="bg-[#25D366] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span
                  className="text-white text-sm font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  JS
                </span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Jey Scent</p>
                <p className="text-white/80 text-xs">
                  Usually replies within minutes
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                Hello! 🤍 Welcome to Jey Scent. How can we help you today?
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
              Quick messages
            </p>
            <div className="space-y-2">
              {messages.map((msg, i) => (
                <a
                  key={i}
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-left text-sm px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  {msg}
                </a>
              ))}
            </div>

            {/* Custom message */}
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block w-full text-center bg-[#25D366] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#20BD5A] transition-colors"
            >
              Start Chat
            </a>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
          open ? "bg-gray-700 rotate-0" : "bg-[#25D366]"
        }`}
        aria-label="Chat on WhatsApp"
      >
        {open ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
      </button>
    </div>
  );
}