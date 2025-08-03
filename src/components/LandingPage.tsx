import React from 'react';
import { Heart, Shield, Clock, Users, Star, ArrowRight, CheckCircle, Phone, Mail, MapPin, LogIn, User } from 'lucide-react';
import { AuthUser } from '../lib/auth';

interface LandingPageProps {
  onGetStarted: () => void;
  onShowLogin: () => void;
  onLogout: () => void;
  userAccount: AuthUser | null;
  onShowProfile: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onShowLogin, onLogout, userAccount, onShowProfile }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="text-white" size={24} />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">MediCare Online</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">サービス</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">利用方法</a>
              <a href="#doctors" className="text-gray-600 hover:text-blue-600 transition-colors">医師紹介</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">お問い合わせ</a>
            </nav>
            <div className="flex items-center gap-4">
              {userAccount ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                    <User size={16} />
                    <span className="text-sm font-medium">{userAccount.email}</span>
                  </div>
                  <button
                    onClick={onShowProfile}
                    className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 text-sm"
                  >
                    プロフィール
                  </button>
                  <button
                    onClick={onLogout}
                    className="text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 text-sm"
                  >
                    ログアウト
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    診療予約
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={onShowLogin}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
                  >
                    <LogIn size={16} />
                    ログイン
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    診療予約
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                自宅で受ける
                <span className="text-blue-700">安心の医療</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AIアバターとの自然な会話で問診を行い、経験豊富な医師とのオンライン診療を受けられます。
                待ち時間なし、移動時間なしで、質の高い医療サービスをご提供します。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  className="bg-blue-600 text-white px-8 py-4 rounded-md hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center"
                >
                  診療予約
                  <ArrowRight className="ml-2" size={20} />
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-md hover:bg-blue-50 transition-colors font-medium text-lg">
                  サービス詳細
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="text-white" size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">田中 一郎 医師</h3>
                    <p className="text-gray-600 text-sm">内科・総合診療科</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  「患者様一人ひとりに寄り添った丁寧な診療を心がけています。オンラインでも対面と変わらない質の高い医療を提供いたします。」
                </p>
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">4.9/5.0 (128件の評価)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">なぜMediCare Onlineが選ばれるのか</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              最新のAI技術と経験豊富な医師による、新しい形のオンライン診療サービスです
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">24時間予約可能</h3>
              <p className="text-gray-600">
                いつでもどこでも、スマートフォンやPCから簡単に診療予約ができます
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AIアバター問診</h3>
              <p className="text-gray-600">
                3Dアバターとの自然な会話で、リラックスして問診を受けられます
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">安心・安全</h3>
              <p className="text-gray-600">
                医療情報は厳重に管理され、プライバシーを完全に保護します
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">質の高い医療</h3>
              <p className="text-gray-600">
                経験豊富な医師による、対面診療と変わらない質の高い医療サービス
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">利用方法</h2>
            <p className="text-xl text-gray-600">
              簡単3ステップで、すぐに診療を受けられます
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                <Users className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">患者登録・予約</h3>
              <p className="text-gray-600">
                基本情報と保険証を登録し、希望の医師と日時を選択して診療予約を行います
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                <Heart className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI問診</h3>
              <p className="text-gray-600">
                待ち時間中に3Dアバターと会話しながら、自然に問診票を作成します
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                <CheckCircle className="text-teal-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">オンライン診療</h3>
              <p className="text-gray-600">
                医師とビデオ通話で診療を受け、必要に応じて処方箋を発行してもらいます
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-gray-300">診療実績</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-300">専門医師</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">4.9</div>
              <div className="text-gray-300">満足度評価</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-300">サポート体制</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            今すぐオンライン診療を始めませんか？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            初回診療は特別価格でご提供。安心・安全なオンライン医療をお試しください。
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-10 py-4 rounded-md hover:bg-gray-100 transition-colors font-bold text-lg"
          >
            診療予約
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <Heart className="text-white" size={20} />
                </div>
                <span className="ml-2 text-xl font-bold">MediCare Online</span>
              </div>
              <p className="text-gray-400 mb-4">
                最新のAI技術と経験豊富な医師による、新しい形のオンライン診療サービス
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">サービス</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">オンライン診療</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI問診</a></li>
                <li><a href="#" className="hover:text-white transition-colors">処方箋発行</a></li>
                <li><a href="#" className="hover:text-white transition-colors">健康相談</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">よくある質問</a></li>
                <li><a href="#" className="hover:text-white transition-colors">利用ガイド</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center">
                  <Phone size={16} className="mr-2" />
                  <span>0120-123-456</span>
                </div>
                <div className="flex items-center">
                  <Mail size={16} className="mr-2" />
                  <span>info@medicare-online.jp</span>
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2" />
                  <span>東京都渋谷区...</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MediCare Online. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;