'use client';

import React from 'react';
import { MessageSquare, Eye, Phone } from 'lucide-react';

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  voucherCode?: string;
}

interface WhatsAppSandboxProps {
  simulatedEmails: SimulatedEmail[];
  setSimulatedEmails: React.Dispatch<React.SetStateAction<SimulatedEmail[]>>;
  isEmailInboxOpen: boolean;
  setIsEmailInboxOpen: (open: boolean) => void;
  selectedEmail: SimulatedEmail | null;
  setSelectedEmail: (email: SimulatedEmail | null) => void;
}

export default function WhatsAppSandbox({
  simulatedEmails,
  setSimulatedEmails,
  isEmailInboxOpen,
  setIsEmailInboxOpen,
  selectedEmail,
  setSelectedEmail
}: WhatsAppSandboxProps) {
  return (
    <>
      {/* FLOATING SIMULATED WHATSAPP INBOX BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsEmailInboxOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border border-emerald-400 group cursor-pointer"
          id="btn-simulated-inbox"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 fill-white" />
            {simulatedEmails.length > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white animate-bounce">
                {simulatedEmails.length}
              </span>
            )}
          </div>
          <span className="text-xs font-bold font-sans max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
            WhatsApp Gateway (Simulasi)
          </span>
        </button>
      </div>

      {/* SIMULATED WHATSAPP INBOX LIST MODAL */}
      {isEmailInboxOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-emerald-800 text-white p-5 flex justify-between items-center border-b border-emerald-900">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-900/40 text-emerald-300 p-2 rounded-xl border border-emerald-750">
                  <MessageSquare className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">WhatsApp Simulator Gateway (Local Dev)</h3>
                  <p className="text-[10px] text-emerald-200 opacity-90">Simulasi instan pengiriman kode voucher & kredensial login via chat WhatsApp.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailInboxOpen(false)}
                className="text-emerald-200 hover:text-white text-xs bg-emerald-900/55 p-1.5 rounded-lg border border-emerald-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {simulatedEmails.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-semibold text-xs text-slate-500">Belum ada pesan WhatsApp keluar.</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Silakan coba membuat voucher baru atau lakukan simulasi pembelian untuk mengirim pesan kredensial otomatis.</p>
                </div>
              ) : (
                simulatedEmails.map(email => (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                    }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer flex justify-between items-center gap-4 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border mt-0.5 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                        <MessageSquare className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-xs">{email.to}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-semibold">
                            ID: {email.id}
                          </span>
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-900 mt-1 leading-snug">{email.subject}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{new Date(email.date).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <button className="bg-slate-50 text-slate-600 border px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Lihat Chat
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-100 p-4 text-center border-t border-slate-200 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-medium">WhatsApp sandbox client-emulation active</span>
              <button
                onClick={() => {
                  setSimulatedEmails([]);
                  localStorage.removeItem('psychometric_simulated_emails');
                }}
                className="text-rose-600 hover:text-rose-800 font-semibold text-[10px] hover:underline cursor-pointer"
              >
                Hapus Semua Histori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL SELECTED WHATSAPP MODAL - MOBILE MOCKUP DISPLAY */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-[#efeae2] rounded-3xl shadow-2xl border-4 border-slate-800 max-w-sm w-full flex flex-col h-[600px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
            
            {/* Smartphone Notch Area */}
            <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 flex justify-center items-center z-50">
              <div className="w-20 h-3.5 bg-black rounded-b-xl"></div>
            </div>

            {/* WhatsApp Contact Header Panel */}
            <div className="bg-[#008069] text-white pt-6 pb-3 px-4 flex items-center gap-3 shadow-md z-40">
              <button 
                onClick={() => setSelectedEmail(null)}
                className="text-white hover:opacity-80 p-1 rounded-full text-lg cursor-pointer font-bold"
              >
                ←
              </button>
              <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-white font-bold relative text-sm border border-emerald-600">
                CBT
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#008069] rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs truncate">CBT Psikometrik Official</span>
                  <span className="text-[9px] bg-emerald-500 text-white px-1 py-0.2 rounded-full font-sans font-bold">✓</span>
                </div>
                <div className="text-[9px] text-emerald-100 opacity-90 truncate text-left">Mengirim pesan ke: {selectedEmail.to}</div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-3.5 h-3.5 fill-current opacity-90" />
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="font-black text-xs hover:opacity-80 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* WhatsApp Chat Body area (Classic Wallpaper theme) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-between" style={{
              backgroundImage: 'radial-gradient(circle, #e5ddd5 10%, transparent 11%)',
              backgroundSize: '12px 12px',
              backgroundColor: '#efeae2'
            }}>
              
              {/* Date Indicator bubble */}
              <div className="self-center bg-white/75 border border-slate-200/50 rounded-lg px-2 py-0.5 text-[9px] font-semibold text-slate-500 shadow-2xs">
                HARI INI
              </div>

              {/* Chat bubble */}
              <div className="self-start max-w-[85%] bg-white rounded-2xl rounded-tl-none p-3 shadow-xs border border-slate-200/50 relative flex flex-col">
                {/* Bubble Tip decoration */}
                <div className="absolute top-0 -left-1.5 w-2 h-3.5 bg-white" style={{
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
                }}></div>

                {/* Message text with customized parsing */}
                <div 
                  className="text-[11px] text-slate-800 text-left leading-relaxed font-sans whitespace-pre-wrap select-text break-words"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      let text = selectedEmail.body || '';
                      // Escape HTML
                      text = text
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                      
                      // Format *bold*
                      text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
                      // Format _italic_
                      text = text.replace(/_(.*?)_/g, '<em>$1</em>');
                      // Format line breaks
                      text = text.replace(/\n/g, '<br />');
                      return text;
                    })()
                  }}
                />

                {/* Status bar */}
                <div className="self-end flex items-center gap-1 text-[9px] text-slate-400 mt-1 font-mono">
                  <span>{new Date(selectedEmail.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-[#53bdeb] font-bold text-[11px] leading-none">✓✓</span>
                </div>
              </div>

              {/* Verified Business info disclaimer card */}
              <div className="self-center bg-[#f0f2f5] border border-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-center text-[9px] max-w-xs leading-normal font-sans shadow-2xs">
                🔒 Chat ini dengan akun bisnis resmi *CBT Psikometrik*. Ketuk untuk info selengkapnya.
              </div>
            </div>

            {/* Simulated Phone Navigation Bottom Bar */}
            <div className="bg-slate-900 p-2.5 flex justify-center items-center gap-12 z-40 border-t border-slate-800">
              <button 
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
              >
                ◀ KEMBALI
              </button>
              <div className="w-12 h-3 bg-slate-700 rounded-full"></div>
              <div className="w-3.5 h-3.5 border-2 border-slate-700 rounded-xs"></div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
