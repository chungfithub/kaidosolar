'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Lock, User, Zap } from 'lucide-react';

const initialState = {
  error: '',
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="login-wrapper">
      <div className="login-blob blob-1"></div>
      <div className="login-blob blob-2"></div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-box">
              <Zap size={32} color="white" />
            </div>
            <h2 className="login-title">Kaido Solar</h2>
            <p className="login-subtitle">Hệ Thống Quản Trị Trung Tâm</p>
          </div>

          <form action={formAction} className="login-form">
            {state?.error && (
              <div className="login-error">
                {state.error}
              </div>
            )}
            
            <div className="input-group">
              <label>Tên đăng nhập</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input 
                  type="text" 
                  name="username" 
                  placeholder="Nhập tên đăng nhập" 
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input 
                  type="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isPending}>
              {isPending ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
          </form>
          
          <div className="login-footer">
            &copy; {new Date().getFullYear()} Kaido Solar. All rights reserved.
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }

        .login-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          z-index: 0;
          animation: float 10s infinite alternate ease-in-out;
        }

        .blob-1 {
          top: -10%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: #10B981;
        }

        .blob-2 {
          bottom: -10%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: #3B82F6;
          animation-delay: -5s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }

        .login-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-w: 420px;
          padding: 20px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo-box {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #10B981, #3B82F6);
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .login-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 15px;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          text-align: center;
          margin-bottom: 24px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.4);
          transition: color 0.3s ease;
        }

        .input-wrapper input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px 14px 48px;
          color: #ffffff;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.3s ease;
          outline: none;
        }

        .input-wrapper input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .input-wrapper input:focus {
          border-color: #10B981;
          background: rgba(0, 0, 0, 0.3);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .input-wrapper input:focus + .input-icon,
        .input-wrapper input:focus ~ .input-icon {
          color: #10B981;
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 12px;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 25px rgba(16, 185, 129, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
