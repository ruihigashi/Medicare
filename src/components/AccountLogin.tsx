import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, getPatientData, AuthUser } from '../lib/auth';
import PatientProfileForm from './PatientProfileForm';

interface AccountLoginProps {
  onLogin: (user: AuthUser, patientData?: any) => void;
  onBack: () => void;
}

const AccountLogin: React.FC<AccountLoginProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [newUser, setNewUser] = useState<AuthUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください');
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }

    if (!isLogin && formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('正しいメールアドレスを入力してください');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // ログイン
        const { user, error: loginError } = await loginUser({
          email: formData.email,
          password: formData.password
        });

        if (loginError) {
          setError(loginError);
          return;
        }

        if (user) {
          // 患者情報を取得
          const { data: patientData } = await getPatientData(user.id);
          onLogin(user, patientData);
        }
      } else {
        // 新規登録
        const { user, error: registerError } = await registerUser({
          email: formData.email,
          password: formData.password
        });

        if (registerError) {
          setError(registerError);
          return;
        }

        if (user) {
          onLogin(user);
        }
        
        // 新規登録後はプロフィール入力画面を表示
        setNewUser(user);
        setShowProfileForm(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileComplete = (patientData: any) => {
    if (newUser) {
      onLogin(newUser, patientData);
    }
  };

  const handleSkipProfile = () => {
    if (newUser) {
      onLogin(newUser);
    }
  };

  // プロフィール入力画面
  if (showProfileForm && newUser) {
    return (
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            アカウント作成完了！
          </h1>
          <p className="text-gray-600">
            患者情報を入力すると、次回から自動入力されます
          </p>
        </div>
        
        <PatientProfileForm
          userAccount={newUser}
          onComplete={handleProfileComplete}
          onSkip={handleSkipProfile}
          isInitialSetup={true}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Close button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
          {isLogin ? <LogIn className="text-white" size={32} /> : <UserPlus className="text-white" size={32} />}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isLogin ? 'ログイン' : 'アカウント登録'}
        </h1>
        <p className="text-gray-600">
          {isLogin 
            ? 'アカウントにログインして、保存された患者情報を使用できます' 
            : 'アカウントを作成して、患者情報を保存しましょう'
          }
        </p>
      </div>

      {/* Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => {
            setIsLogin(true);
            setError('');
            setFormData({ email: '', password: '', confirmPassword: '' });
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            isLogin 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ログイン
        </button>
        <button
          onClick={() => {
            setIsLogin(false);
            setError('');
            setFormData({ email: '', password: '', confirmPassword: '' });
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            !isLogin 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          新規登録
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail size={16} className="inline mr-2" />
            メールアドレス
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
            placeholder="example@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Lock size={16} className="inline mr-2" />
            パスワード
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              placeholder={isLogin ? 'パスワードを入力' : '6文字以上で入力'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              パスワード確認
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              placeholder="パスワードを再入力"
              required
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
            {error.includes('アカウントをお持ちでない場合') && (
              <p className="text-red-600 text-xs mt-1">
                初回の方は「新規登録」タブからアカウントを作成してください。
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:from-blue-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              処理中...
            </>
          ) : (
            <>
              {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              {isLogin ? 'ログイン' : 'アカウント作成'}
            </>
          )}
        </button>
      </form>

      {/* Benefits */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">アカウントのメリット</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 患者情報の自動入力</li>
          <li>• 診療履歴の管理</li>
          <li>• 予約の簡単管理</li>
          <li>• セキュアな情報保護</li>
        </ul>
      </div>

      {/* Guest option */}
      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          アカウントなしで続行する
        </button>
      </div>
    </div>
  );
};

export default AccountLogin;