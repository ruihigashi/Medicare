import React, { useState } from 'react';
import { User, ArrowLeft, Heart, LogIn, Bot, CheckCircle, Sparkles } from 'lucide-react';
import { Appointment, Patient } from '../types';
import { AuthUser } from '../lib/auth';

interface AppointmentBookingProps {
  patient: Patient;
  onAppointmentBooked: (appointment: Appointment) => void;
  onBack?: () => void;
  selectedSymptoms?: string[];
  additionalSymptoms?: string;
  onShowLogin: () => void;
  onLogout: () => void;
  userAccount: AuthUser | null;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ 
  patient, 
  onAppointmentBooked, 
  onBack, 
  selectedSymptoms = [], 
  additionalSymptoms = '',
  onShowLogin,
  onLogout,
  userAccount
}) => {
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [symptoms, setSymptoms] = useState(() => {
    // Initialize with selected symptoms
    const symptomLabels = selectedSymptoms.map(id => {
      const symptomMap: { [key: string]: string } = {
        'fever': '発熱・熱っぽさ',
        'cough': '咳・痰',
        'headache': '頭痛',
        'stomach': '腹痛・胃痛',
        'throat': 'のどの痛み',
        'runny_nose': '鼻水・鼻づまり',
        'fatigue': 'だるさ・疲労感',
        'dizziness': 'めまい・ふらつき',
        'nausea': '吐き気・嘔吐',
        'diarrhea': '下痢・便秘',
        'skin': '皮膚のトラブル',
        'joint': '関節・筋肉の痛み',
        'chest': '胸の痛み・息苦しさ',
        'back': '腰痛・背中の痛み',
        'eye': '目の症状',
        'ear': '耳の症状',
        'mental': '不安・うつ・不眠',
        'other': 'その他'
      };
      return symptomMap[id] || id;
    }).join('、');
    
    return [symptomLabels, additionalSymptoms].filter(Boolean).join('\n');
  });

  // Check if patient data was auto-filled from profile
  React.useEffect(() => {
    if (userAccount && patient) {
      setIsAutoFilled(true);
      // Hide notification after 3 seconds
      const timer = setTimeout(() => {
        setIsAutoFilled(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userAccount, patient]);

  const handleBookAppointment = () => {
    // Generate current date and time for immediate booking
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    const appointment: Appointment = {
      id: Date.now().toString(),
      patientId: patient.id,
      doctorId: 'ai-system',
      doctorName: 'AIシステム',
      department: 'AI診療',
      date: currentDate,
      time: currentTime,
      status: 'scheduled',
      symptoms,
      createdAt: new Date()
    };

    onAppointmentBooked(appointment);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center">
                <Heart className="text-white" size={24} />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">MediCare Online</span>
            </div>
            <div className="flex items-center gap-4">
              {userAccount ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                    <User size={16} />
                    <span className="text-sm font-medium">{userAccount.email}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 text-sm"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <button
                  onClick={onShowLogin}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <LogIn size={16} />
                  ログイン
                </button>
              )}
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                  患者登録に戻る
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          {/* Auto-fill notification */}
          {isAutoFilled && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <p className="text-green-800 font-medium text-sm">プロフィール情報が自動入力されました</p>
              </div>
            </div>
          )}

          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            こんにちは、{patient.name}さん！
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI診療を開始しましょう
          </p>
          <p className="text-gray-500">
            AIが最適な医師とグループを自動選択して、すぐに診療を開始できます
          </p>
        </div>


        {/* Symptoms Summary */}
        {symptoms && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">📋</span>
              </div>
              症状・相談内容
            </h3>
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">{symptoms}</p>
            </div>
          </div>
        )}


        {/* Booking Summary and Action */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">🎯 診療開始の準備完了</h3>
            <div className="space-y-3 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">診療方式:</span>
                <span className="font-semibold text-gray-800">AI診療システム</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">医師選択:</span>
                <span className="font-semibold text-gray-800">AI自動選択</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">開始時間:</span>
                <span className="font-semibold text-green-600">今すぐ</span>
              </div>
            </div>
            
            <button
              onClick={handleBookAppointment}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-xl flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Bot size={28} />
              🚀 AI診療を開始する
            </button>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <p className="text-blue-800 text-center leading-relaxed">
              <strong>📝 次のステップ:</strong> 診療開始後、AI問診を行います。問診結果に基づいて最適な医師とグループが自動的に決定され、グループ診断後最長30分の待機時間を経て診療が開始されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;