import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Laptop,
} from 'lucide-react';
import { login, User } from '../services/authService';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  shopName?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  shopName = 'Đình Phong Apple',
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.login-badge', {
        y: -15,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
      });
      gsap.from(cardRef.current, {
        scale: 0.94,
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.login-stagger', {
        y: 12,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.2,
        ease: 'power2.out',
      });
    },
    { scope: containerRef }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Đăng nhập không thành công.');
        // Shake card on error
        if (cardRef.current) {
          gsap.fromTo(
            cardRef.current,
            { x: -8 },
            { x: 8, duration: 0.08, repeat: 4, yoyo: true, ease: 'power2.inOut' }
          );
        }
      }
    }, 200);
  };

  const handleQuickLoginAdmin = () => {
    setUsername('admin');
    setPassword('123');
    setErrorMsg(null);
    const res = login('admin', '123');
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 text-white overflow-hidden selection:bg-blue-500 selection:text-white"
    >
      {/* Dynamic ambient background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-4">
        {/* Top Brand Pill */}
        <div className="login-badge text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-md text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            Hệ thống Quản lý Kho Máy & Bán Hàng
          </span>
        </div>

        {/* Login Card */}
        <div
          ref={cardRef}
          className="relative rounded-3xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-black/60 overflow-hidden"
        >
          {/* Subtle top card glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 opacity-80" />

          {/* Logo & Header */}
          <div className="text-center space-y-2 mb-7">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Laptop className="w-7 h-7 text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {shopName}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Đăng nhập tài khoản nội bộ để truy cập dữ liệu máy
            </p>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="login-stagger space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên tài khoản (VD: admin, nv01...)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-stagger space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="login-stagger pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xác thực...
                  </span>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Helper */}
          <div className="login-stagger mt-6 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Tài khoản Admin mặc định:
              </span>
              <button
                type="button"
                onClick={handleQuickLoginAdmin}
                className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer text-xs"
              >
                Bấm đăng nhập ngay (admin / 123)
              </button>
            </div>

            <div className="rounded-xl bg-slate-800/50 p-2.5 text-[11px] text-slate-400 text-center leading-relaxed border border-slate-700/40">
              🛡️ Hệ thống nội bộ bảo vệ dữ liệu. Sau khi đăng nhập bằng Admin, bạn có thể tạo thêm tài khoản cho nhân viên trong bảng quản lý.
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          Đình Phong Apple Management System • Powered by GSAP & React
        </div>
      </div>
    </div>
  );
};

