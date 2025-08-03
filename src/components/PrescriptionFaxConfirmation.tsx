import React, { useState, useEffect } from 'react';
import { CheckCircle, Send, Phone, MapPin, Clock, Star, FileText, Download, ArrowLeft, Zap, Shield, AlertCircle, Info, Building2, Fan as Fax, User, Calendar, Pill, Heart } from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;
  rating: number;
  openHours: string;
  isOpen: boolean;
  faxNumber: string;
  features: string[];
}

interface PrescriptionFaxConfirmationProps {
  selectedPharmacy: Pharmacy;
  patientName: string;
  onComplete: () => void;
  onBack: () => void;
}

const PrescriptionFaxConfirmation: React.FC<PrescriptionFaxConfirmationProps> = ({
  selectedPharmacy,
  patientName,
  onComplete,
  onBack
}) => {
  const [faxStatus, setFaxStatus] = useState<'sending' | 'sent' | 'confirmed'>('sending');
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Simulate FAX sending process with realistic timing
    const steps = [
      { delay: 2000, status: 'sending', step: 2 },
      { delay: 5000, status: 'sent', step: 3 },
      { delay: 8000, status: 'confirmed', step: 4 }
    ];

    steps.forEach(({ delay, status, step }) => {
      setTimeout(() => {
        setFaxStatus(status as any);
        setCurrentStep(step);
      }, delay);
    });

    // Countdown timer for estimated preparation time
    const countdownTimer = setInterval(() => {
      setEstimatedTime(prev => Math.max(0, prev - 1));
    }, 60000);

    return () => clearInterval(countdownTimer);
  }, []);

  const getStatusConfig = () => {
    switch (faxStatus) {
      case 'sending':
        return {
          title: '📤 処方箋を送信中',
          subtitle: '薬局にFAXで処方箋を送信しています...',
          color: 'blue',
          bgColor: 'from-blue-500 to-indigo-600',
          icon: <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full"></div>
        };
      case 'sent':
        return {
          title: '📋 送信完了',
          subtitle: '処方箋の送信が完了しました。薬局での確認をお待ちください',
          color: 'indigo',
          bgColor: 'from-indigo-500 to-purple-600',
          icon: <Send className="text-white" size={32} />
        };
      case 'confirmed':
        return {
          title: '✅ 薬局で確認済み',
          subtitle: '薬局で処方箋を確認しました。お薬の準備を開始しています',
          color: 'green',
          bgColor: 'from-green-500 to-emerald-600',
          icon: <CheckCircle className="text-white" size={32} />
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-r ${status.bgColor}`}>
                {status.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📠 処方箋FAX送信</h1>
                <p className="text-gray-600">{patientName}さんの処方箋</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeft size={18} />
              戻る
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Main Status Card */}
        <div className="mb-8">
          <div className={`bg-gradient-to-r ${status.bgColor} rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-24 translate-y-24"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                {status.icon}
              </div>
              <h2 className="text-3xl font-bold mb-3">{status.title}</h2>
              <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">{status.subtitle}</p>
              
              {/* Progress Steps */}
              <div className="flex justify-center items-center gap-4 mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentStep >= step 
                        ? 'bg-white text-gray-800' 
                        : 'bg-white/20 text-white/60'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-12 h-1 mx-2 rounded-full ${
                        currentStep > step ? 'bg-white' : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {faxStatus === 'confirmed' && (
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Pill className="text-white" size={24} />
                    <h3 className="text-xl font-bold">💊 お薬準備時間</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold mb-2">{estimatedTime}分</p>
                    <p className="text-white/80">予想準備時間</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Process Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Zap className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">📋 処理状況</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: '✅ 処方箋作成完了',
                    description: '医師による処方箋が作成されました',
                    completed: true,
                    time: '完了'
                  },
                  {
                    step: 2,
                    title: faxStatus === 'sending' ? '📤 FAX送信中...' : '📠 FAX送信完了',
                    description: faxStatus === 'sending' ? '薬局に処方箋を送信しています' : '薬局への送信が完了しました',
                    completed: faxStatus !== 'sending',
                    active: faxStatus === 'sending',
                    time: faxStatus !== 'sending' ? '完了' : '処理中'
                  },
                  {
                    step: 3,
                    title: faxStatus === 'confirmed' ? '🏥 薬局での確認完了' : '⏳ 薬局での確認待ち',
                    description: faxStatus === 'confirmed' ? '薬局で処方箋を確認しました' : '薬局からの確認をお待ちください',
                    completed: faxStatus === 'confirmed',
                    active: faxStatus === 'sent',
                    time: faxStatus === 'confirmed' ? '完了' : '待機中'
                  },
                  {
                    step: 4,
                    title: '💊 薬の準備完了（予定）',
                    description: '薬剤師による調剤作業',
                    completed: false,
                    time: `${estimatedTime}分後`
                  }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 p-4 rounded-2xl transition-all hover:bg-gray-50">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                      item.completed 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                        : item.active
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {item.completed ? '✓' : item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg mb-1 ${
                        item.completed ? 'text-green-700' : item.active ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {item.title}
                      </h4>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        item.completed 
                          ? 'bg-green-100 text-green-700' 
                          : item.active
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl shadow-xl p-8 border border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <Info className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">💊 お薬受け取りについて</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    step: '1',
                    icon: '📞',
                    title: '薬局から準備完了の連絡',
                    description: 'お薬の準備ができ次第、薬局からお電話いたします'
                  },
                  {
                    step: '2',
                    icon: '🏥',
                    title: '必要な持ち物',
                    description: '保険証と診察券をお忘れなくお持ちください'
                  },
                  {
                    step: '3',
                    icon: '👨‍⚕️',
                    title: '薬剤師の説明',
                    description: 'お薬の飲み方や注意事項をしっかりお聞きください'
                  }
                ].map((item) => (
                  <div key={item.step} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                        {item.icon}
                      </div>
                      <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">
                        {item.step}
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2 text-center">{item.title}</h4>
                    <p className="text-gray-600 text-sm text-center leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pharmacy Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <Building2 className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">🏥 送信先薬局</h3>
              </div>
              
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedPharmacy.name}</h4>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {selectedPharmacy.isOpen ? (
                      <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full font-bold border border-green-200 flex items-center gap-2">
                        🟢 営業中
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 rounded-full font-bold border border-red-200 flex items-center gap-2">
                        🔴 営業時間外
                      </span>
                    )}
                    <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                      <Star className="text-yellow-500 fill-current" size={14} />
                      <span className="text-yellow-700 font-medium text-sm">{selectedPharmacy.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      icon: <MapPin className="text-blue-600" size={20} />,
                      label: '住所',
                      value: selectedPharmacy.address,
                      color: 'blue'
                    },
                    {
                      icon: <Phone className="text-green-600" size={20} />,
                      label: '電話番号',
                      value: selectedPharmacy.phone,
                      color: 'green'
                    },
                    {
                      icon: <Clock className="text-purple-600" size={20} />,
                      label: '営業時間',
                      value: selectedPharmacy.openHours,
                      color: 'purple'
                    },
                    {
                      icon: <Fax className="text-indigo-600" size={20} />,
                      label: 'FAX番号',
                      value: selectedPharmacy.faxNumber,
                      color: 'indigo',
                      highlight: true
                    }
                  ].map((item, index) => (
                    <div key={index} className={`p-4 rounded-2xl border-2 ${
                      item.highlight 
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {item.icon}
                        <div className="flex-1">
                          <p className={`font-medium text-${item.color}-800 mb-1`}>{item.label}</p>
                          <p className={`text-sm ${item.highlight ? 'font-mono font-bold text-indigo-700' : 'text-gray-700'}`}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Heart className="text-red-500" size={16} />
                    🏷️ サービス
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedPharmacy.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs rounded-full font-medium border border-blue-200"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-3xl border-2 border-red-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="text-white" size={20} />
                </div>
                <h3 className="text-lg font-bold text-red-800">🆘 お困りの際は</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="text-red-600" size={18} />
                    <div>
                      <p className="font-medium text-red-800">薬局直通</p>
                      <p className="text-red-600 font-mono text-sm">{selectedPharmacy.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Shield className="text-red-600" size={18} />
                    <div>
                      <p className="font-medium text-red-800">MediCare サポート</p>
                      <p className="text-red-600 font-mono text-sm">0120-123-456</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {faxStatus === 'confirmed' && (
          <div className="mt-8 text-center">
            <button
              onClick={onComplete}
              className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
            >
              <CheckCircle size={24} />
              診療完了画面に進む
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionFaxConfirmation;