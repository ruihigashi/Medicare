import React, { useState } from 'react';
import { Heart, AlertTriangle, Phone, ArrowLeft, CheckCircle, Plus, Stethoscope, LogIn, User } from 'lucide-react';
import { AuthUser } from '../lib/auth';

interface SymptomSelectionProps {
  onSymptomsSelected: (symptoms: string[], additional: string) => void;
  onBack: () => void;
  onShowLogin: () => void;
  onLogout: () => void;
  userAccount: AuthUser | null;
}

const SymptomSelection: React.FC<SymptomSelectionProps> = ({ onSymptomsSelected, onBack, onShowLogin, onLogout, userAccount }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [additionalSymptoms, setAdditionalSymptoms] = useState('');

  const commonSymptoms = [
    { id: 'fever', label: '発熱・熱っぽさ', icon: '🌡️' },
    { id: 'cough', label: '咳・痰', icon: '😷' },
    { id: 'headache', label: '頭痛', icon: '🤕' },
    { id: 'stomach', label: '腹痛・胃痛', icon: '🤢' },
    { id: 'throat', label: 'のどの痛み', icon: '😣' },
    { id: 'runny_nose', label: '鼻水・鼻づまり', icon: '🤧' },
    { id: 'fatigue', label: 'だるさ・疲労感', icon: '😴' },
    { id: 'dizziness', label: 'めまい・ふらつき', icon: '😵' },
    { id: 'nausea', label: '吐き気・嘔吐', icon: '🤮' },
    { id: 'diarrhea', label: '下痢・便秘', icon: '🚽' },
    { id: 'skin', label: '皮膚のトラブル', icon: '🩹' },
    { id: 'joint', label: '関節・筋肉の痛み', icon: '🦴' },
    { id: 'chest', label: '胸の痛み・息苦しさ', icon: '💓' },
    { id: 'back', label: '腰痛・背中の痛み', icon: '🏃‍♂️' },
    { id: 'eye', label: '目の症状', icon: '👁️' },
    { id: 'ear', label: '耳の症状', icon: '👂' },
    { id: 'mental', label: '不安・うつ・不眠', icon: '😔' },
    { id: 'other', label: 'その他', icon: '❓' }
  ];

  const emergencySymptoms = [
    '激しい胸の痛み',
    '呼吸困難・息ができない',
    '意識がもうろうとしている',
    '激しい頭痛（今まで経験したことのない痛み）',
    '高熱（39度以上）で意識がはっきりしない',
    '激しい腹痛で動けない',
    '大量の出血',
    'けいれん・ひきつけ',
    '急に話せなくなった・手足に力が入らない',
    '急激な視力低下・失明'
  ];

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleContinue = () => {
    if (selectedSymptoms.length === 0 && !additionalSymptoms.trim()) {
      alert('症状を選択するか、詳細を入力してください。');
      return;
    }
    onSymptomsSelected(selectedSymptoms, additionalSymptoms);
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
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={20} />
                トップページに戻る
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">症状の選択</h1>
            <p className="text-gray-600">現在お困りの症状を選択してください（複数選択可能）</p>
          </div>
        </div>

        {/* Emergency Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-white" size={24} />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
                <Phone size={20} />
                緊急時は直ちに救急車（119番）を呼んでください
              </h2>
              <p className="text-red-700 mb-4 font-medium">
                以下の症状がある場合は、オンライン診療ではなく、すぐに救急車を呼ぶか、救急外来を受診してください：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {emergencySymptoms.map((symptom, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-medium">{symptom}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-red-100 rounded-md">
                <p className="text-red-800 font-bold text-center">
                  🚨 緊急時は迷わず119番通報してください 🚨
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Symptom Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">該当する症状を選択してください</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {commonSymptoms.map((symptom) => (
              <button
                key={symptom.id}
                onClick={() => handleSymptomToggle(symptom.id)}
                className={`p-4 rounded-md border-2 transition-colors text-left ${
                  selectedSymptoms.includes(symptom.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{symptom.icon}</span>
                  <div className="flex-1">
                    <span className={`font-medium ${
                      selectedSymptoms.includes(symptom.id) ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {symptom.label}
                    </span>
                    {selectedSymptoms.includes(symptom.id) && (
                      <CheckCircle className="inline ml-2 text-blue-500" size={16} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Additional Symptoms */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={20} />
              その他の症状・詳細
            </h3>
            <textarea
              value={additionalSymptoms}
              onChange={(e) => setAdditionalSymptoms(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors resize-none"
              rows={4}
              placeholder="上記にない症状や、詳しい状況があればお書きください。&#10;例：「3日前から微熱が続いている」「朝起きた時に特に痛みが強い」など"
            />
          </div>
        </div>

        {/* Selected Symptoms Summary */}
        {selectedSymptoms.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">選択された症状</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((symptomId) => {
                const symptom = commonSymptoms.find(s => s.id === symptomId);
                return symptom ? (
                  <span
                    key={symptomId}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
                  >
                    <span>{symptom.icon}</span>
                    {symptom.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={selectedSymptoms.length === 0 && !additionalSymptoms.trim()}
            className="px-8 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            患者情報の入力に進む
          </button>
          <p className="text-gray-500 text-sm mt-3">
            症状を選択後、患者情報の登録に進みます
          </p>
        </div>
      </div>
    </div>
  );
};

export default SymptomSelection;