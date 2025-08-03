import React, { useState } from 'react';
import { User, Heart, LogIn, CheckCircle, FileText, Star, Clock, Stethoscope, Pill, Calendar, Phone, Mail, MapPin, ArrowLeft, Award, Shield, Zap, BookOpen, MessageSquare } from 'lucide-react';
import { Patient, Appointment } from '../types';
import { AuthUser } from '../lib/auth';

interface ConsultationResultsProps {
  patient: Patient;
  appointment: Appointment;
  onShowLogin: () => void;
  onLogout: () => void;
  userAccount: AuthUser | null;
  onBackToLanding: () => void;
}

const ConsultationResults: React.FC<ConsultationResultsProps> = ({
  patient,
  appointment,
  onShowLogin,
  onLogout,
  userAccount,
  onBackToLanding
}) => {
  const [showPrescription, setShowPrescription] = useState(false);

  // Mock diagnosis and prescription data
  const diagnosisResult = {
    diagnosis: '軽度の上気道感染症（風邪症候群）',
    severity: '軽度',
    confidence: '95%',
    recommendations: [
      '十分な休息を取る',
      '水分を多めに摂取する',
      '症状が悪化した場合は再受診する',
      '処方薬を指示通りに服用する'
    ],
    followUp: '1週間後に症状が改善しない場合は再受診してください',
    doctorNotes: '典型的な風邪の症状です。処方薬で症状の緩和が期待できます。'
  };

  const prescription = {
    medications: [
      {
        name: 'アセトアミノフェン錠 500mg',
        dosage: '1回1錠、1日3回',
        duration: '5日分',
        instructions: '食後に服用してください',
        purpose: '解熱・鎮痛'
      },
      {
        name: 'デキストロメトルファン錠 15mg',
        dosage: '1回1錠、1日3回',
        duration: '5日分',
        instructions: '食後に服用してください',
        purpose: '咳止め'
      }
    ],
    totalCost: '¥1,200（保険適用後）'
  };

  const consultationSummary = {
    startTime: new Date(Date.now() - 15 * 60 * 1000), // 15分前
    endTime: new Date(),
    duration: '15分',
    doctorName: appointment.doctorName,
    department: appointment.department,
    consultationType: 'AIグループ診療'
  };

  const handleConsultationComplete = () => {
    setCurrentStep('results');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <span className="text-2xl font-bold text-gray-900">MediCare Online</span>
                <p className="text-sm text-gray-600">診察完了</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {userAccount ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-700 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/50 shadow-sm">
                    <User size={16} />
                    <span className="text-sm font-medium">{userAccount.email}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-gray-600 hover:text-red-600 transition-all px-4 py-2 rounded-xl hover:bg-red-50 text-sm font-medium"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <button
                  onClick={onShowLogin}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all px-4 py-2 rounded-xl hover:bg-blue-50 font-medium"
                >
                  <LogIn size={16} />
                  ログイン
                </button>
              )}
              <button
                onClick={onBackToLanding}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all px-4 py-2 rounded-xl hover:bg-blue-50 font-medium"
              >
                <ArrowLeft size={16} />
                トップページ
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-12 mb-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-green-400 to-blue-500 transform translate-x-48 -translate-y-48"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 transform -translate-x-40 translate-y-40"></div>
          </div>
          
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
              <CheckCircle className="text-white" size={64} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-ping opacity-20"></div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
              🎉 診療が完了しました
            </h1>
            <p className="text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              {patient.name}さん、お疲れさまでした。診断結果と処方箋をご確認ください。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-lg text-gray-600">
              <div className="flex items-center gap-3 bg-white/50 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/30">
                <Clock size={16} />
                <span className="font-medium">⏱️ {consultationSummary.duration}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/50 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/30">
                <Stethoscope size={16} />
                <span className="font-medium">👨‍⚕️ {consultationSummary.doctorName}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/50 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/30">
                <Calendar size={16} />
                <span className="font-medium">📅 {consultationSummary.endTime.toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Diagnosis Results */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <FileText className="text-white" size={24} />
                </div>
                📋 診断結果
              </h2>
              
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200/50 shadow-lg">
                  <h3 className="font-bold text-blue-800 mb-3 text-xl flex items-center gap-2">
                    <Award size={20} />
                    🏥 診断名
                  </h3>
                  <p className="text-blue-700 text-xl font-semibold">{diagnosisResult.diagnosis}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200/50 shadow-lg">
                    <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                      <Shield size={18} />
                      📊 重症度
                    </h4>
                    <p className="text-green-600 font-bold text-lg">{diagnosisResult.severity}</p>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50 shadow-lg">
                    <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                      <Zap size={18} />
                      🎯 診断確度
                    </h4>
                    <p className="text-purple-600 font-bold text-lg">{diagnosisResult.confidence}</p>
                  </div>
                </div>
                
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200/50 shadow-lg">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <MessageSquare size={20} />
                    💬 医師からのコメント
                  </h4>
                  <p className="text-amber-700 text-lg leading-relaxed">{diagnosisResult.doctorNotes}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-white" size={20} />
                </div>
                📚 治療・生活指導
              </h3>
              <div className="space-y-4">
                {diagnosisResult.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200/50">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="text-white" size={16} />
                    </div>
                    <p className="text-gray-800 font-medium text-lg leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200/50 shadow-lg">
                <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                  <Calendar size={20} />
                  📅 フォローアップ
                </h4>
                <p className="text-orange-700 text-lg font-medium leading-relaxed">{diagnosisResult.followUp}</p>
              </div>
            </div>
          </div>

          {/* Prescription and Actions */}
          <div className="xl:col-span-1 space-y-8">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
                  <Pill className="text-white" size={24} />
                </div>
                💊 処方箋
              </h2>
              
              <div className="space-y-6">
                {prescription.medications.map((med, index) => (
                  <div key={index} className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200/50 shadow-lg">
                    <h4 className="font-bold text-green-800 mb-4 text-lg">{med.name}</h4>
                    <div className="space-y-3 text-green-700">
                      <p className="flex items-start gap-2">
                        <span className="font-bold text-sm bg-green-200 px-2 py-1 rounded-lg">用法・用量:</span> 
                        <span className="font-medium">{med.dosage}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold text-sm bg-green-200 px-2 py-1 rounded-lg">日数:</span> 
                        <span className="font-medium">{med.duration}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold text-sm bg-green-200 px-2 py-1 rounded-lg">服用方法:</span> 
                        <span className="font-medium">{med.instructions}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold text-sm bg-green-200 px-2 py-1 rounded-lg">効果:</span> 
                        <span className="font-medium">{med.purpose}</span>
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">📠</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">処方箋FAX送信</h3>
                    <p className="text-gray-700 font-medium">薬局を選択すると、医師が直接処方箋をFAXで送信します</p>
                  </div>
                  <p className="font-bold text-gray-800 text-xl flex items-center gap-2">
                    💰 総額: <span className="text-green-600">{prescription.totalCost}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleConsultationComplete}
                className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="text-2xl">🏥</span>
                薬局を選択してFAX送信
              </button>
            </div>

            {/* Rating and Feedback */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Star className="text-white" size={20} />
                </div>
                ⭐ 診療の評価
              </h3>
              <div className="text-center mb-6">
                <p className="text-gray-700 mb-6 text-lg font-medium">今回の診療はいかがでしたか？</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-yellow-400 hover:text-yellow-500 transition-all transform hover:scale-110"
                    >
                      <Star size={40} className="fill-current drop-shadow-lg" />
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-blue-400 resize-none text-lg"
                rows={4}
                placeholder="ご感想やご意見をお聞かせください（任意）"
              />
              
              <button className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                📤 評価を送信
              </button>
            </div>

            {/* Contact Information */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Phone className="text-white" size={20} />
                </div>
                🆘 お困りの際は
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-200/50">
                  <Phone className="text-red-600" size={24} />
                  <div>
                    <p className="font-bold text-red-800 text-lg">🚨 緊急時</p>
                    <p className="text-red-600 font-mono font-bold">0120-123-456（24時間対応）</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                  <Mail className="text-blue-600" size={24} />
                  <div>
                    <p className="font-bold text-blue-800 text-lg">📧 お問い合わせ</p>
                    <p className="text-blue-600 font-mono font-bold">support@medicare-online.jp</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl border border-green-200/50">
                  <MapPin className="text-green-600" size={24} />
                  <div>
                    <p className="font-bold text-green-800 text-lg">🏥 提携薬局検索</p>
                    <p className="text-green-600 font-medium">お近くの薬局をご案内します</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 text-white text-center relative overflow-hidden shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-24 translate-y-24"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-6">🎉 お疲れさまでした</h2>
            <p className="text-blue-100 mb-8 text-xl max-w-4xl mx-auto leading-relaxed">
            診療結果は患者ポータルからいつでも確認できます。<br />
            処方箋は印刷してお近くの薬局でお受け取りください。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all font-bold text-lg border border-white/30 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
              📋 診療履歴を見る
            </button>
            <button 
              onClick={onBackToLanding}
              className="px-8 py-4 bg-white text-blue-600 rounded-2xl hover:bg-gray-100 transition-all font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              🏠 トップページに戻る
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationResults;