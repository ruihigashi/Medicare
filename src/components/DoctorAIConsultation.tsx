import React, { useState, useEffect, useRef } from 'react';
import { User, Heart, LogIn, Users, Stethoscope, MessageCircle, Clock, Eye, Volume2, VolumeX, FileText, CheckCircle } from 'lucide-react';
import { Patient, Appointment } from '../types';
import { AuthUser } from '../lib/auth';
import DoctorVideoCall from './DoctorVideoCall';
import VRMViewer from './VRMViewer';

interface DoctorAIConsultationProps {
  patient: Patient;
  appointment: Appointment;
  onShowLogin: () => void;
  onLogout: () => void;
  userAccount: AuthUser | null;
  onConsultationComplete: () => void;
}

interface ConsultationMessage {
  id: string;
  speaker: 'doctor' | 'ai';
  text: string;
  timestamp: Date;
  type: 'greeting' | 'question' | 'response' | 'diagnosis' | 'prescription';
}

const DoctorAIConsultation: React.FC<DoctorAIConsultationProps> = ({
  patient,
  appointment,
  onShowLogin,
  onLogout,
  userAccount,
  onConsultationComplete
}) => {
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'introduction' | 'symptoms' | 'diagnosis' | 'prescription' | 'completed'>('introduction');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isDoctorSpeaking, setIsDoctorSpeaking] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [consultationProgress, setConsultationProgress] = useState(0);
  const vrmViewerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start consultation simulation
    startConsultationSimulation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (speaker: 'doctor' | 'ai', text: string, type: ConsultationMessage['type'] = 'response') => {
    const message: ConsultationMessage = {
      id: Date.now().toString(),
      speaker,
      text,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, message]);
    
    if (speaker === 'ai') {
      setIsAISpeaking(true);
      if (vrmViewerRef.current) {
        vrmViewerRef.current.startSpeaking();
      }
      setTimeout(() => {
        setIsAISpeaking(false);
        if (vrmViewerRef.current) {
          vrmViewerRef.current.stopSpeaking();
        }
      }, text.length * 50 + 1000);
    } else {
      setIsDoctorSpeaking(true);
      setTimeout(() => {
        setIsDoctorSpeaking(false);
      }, text.length * 50 + 1000);
    }
  };

  const startConsultationSimulation = async () => {
    // Introduction phase
    setCurrentPhase('introduction');
    setConsultationProgress(10);
    
    await delay(2000);
    addMessage('doctor', `こんにちは、${patient.name}さん。私は${appointment.doctorName}です。本日はグループ診療にご参加いただき、ありがとうございます。`, 'greeting');
    
    await delay(4000);
    addMessage('ai', `${appointment.doctorName}先生、こんにちは。私は${patient.name}さんの問診を担当したAIアシスタントです。問診結果をご報告いたします。`, 'greeting');
    
    await delay(4000);
    addMessage('doctor', 'ありがとうございます。それでは、患者さんの症状について詳しく教えてください。', 'question');
    
    // Symptoms discussion phase
    setCurrentPhase('symptoms');
    setConsultationProgress(30);
    
    await delay(3000);
    addMessage('ai', `${patient.name}さんの主な症状は「${appointment.symptoms}」です。症状の持続期間は約3日間で、中等度の痛みを訴えられています。現在服用中の薬はなく、アレルギーの既往歴もありません。`, 'response');
    
    await delay(5000);
    addMessage('doctor', 'なるほど。他に気になる症状や、日常生活への影響はありますか？', 'question');
    
    await delay(3000);
    addMessage('ai', '患者さんは軽度の疲労感も訴えており、食欲は正常ですが、夜間の睡眠が浅くなっているとのことです。体温は37.2度で微熱があります。', 'response');
    
    setConsultationProgress(50);
    
    await delay(4000);
    addMessage('doctor', 'ありがとうございます。症状の経過と現在の状態がよく分かりました。検査結果も含めて総合的に判断いたします。', 'response');
    
    // Diagnosis phase
    setCurrentPhase('diagnosis');
    setConsultationProgress(70);
    
    await delay(3000);
    addMessage('doctor', `${patient.name}さんの症状を総合的に判断すると、軽度の上気道感染症の可能性が高いと考えられます。現在の症状は典型的な風邪の初期症状に一致しています。`, 'diagnosis');
    
    await delay(4000);
    addMessage('ai', '先生、この診断に基づいて、患者さんにはどのような治療をお勧めになりますか？', 'question');
    
    // Prescription phase
    setCurrentPhase('prescription');
    setConsultationProgress(90);
    
    await delay(3000);
    addMessage('doctor', '解熱鎮痛剤と咳止めを処方します。また、十分な休息と水分補給を心がけてください。症状が悪化した場合は、すぐにご連絡ください。', 'prescription');
    
    await delay(4000);
    addMessage('ai', `承知いたしました。${patient.name}さんには処方箋と詳しい服薬指導書をお渡しします。お大事になさってください。`, 'response');
    
    await delay(3000);
    addMessage('doctor', `${patient.name}さん、本日はありがとうございました。処方箋は後ほどお渡しします。何かご質問があればいつでもお声かけください。`, 'response');
    
    // Completion
    setCurrentPhase('completed');
    setConsultationProgress(100);
    
    // 3秒後に結果画面に遷移
    setTimeout(() => {
      onConsultationComplete();
    }, 3000);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'introduction': return '挨拶・導入';
      case 'symptoms': return '症状の確認';
      case 'diagnosis': return '診断';
      case 'prescription': return '処方・指導';
      case 'completed': return '診療完了';
      default: return '診療中';
    }
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'introduction': return 'text-blue-600 bg-blue-100';
      case 'symptoms': return 'text-orange-600 bg-orange-100';
      case 'diagnosis': return 'text-purple-600 bg-purple-100';
      case 'prescription': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-3 gap-2 sm:gap-0">
            <div className="flex items-center justify-between sm:justify-start">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-600 to-teal-500 rounded-lg flex items-center justify-center">
                  <Heart className="text-white" size={16} className="sm:w-6 sm:h-6" />
                </div>
                <span className="ml-2 sm:ml-3 text-lg sm:text-2xl font-bold text-gray-900 truncate">MediCare Online</span>
              </div>
              <div className="sm:hidden">
                {userAccount ? (
                  <button
                    onClick={onLogout}
                    className="text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded text-xs"
                  >
                    ログアウト
                  </button>
                ) : (
                  <button
                    onClick={onShowLogin}
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded text-xs"
                  >
                    <LogIn size={14} />
                    ログイン
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPhaseColor()}`}>
                {getPhaseLabel()}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-20 sm:w-32 bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-teal-500 h-1.5 sm:h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${consultationProgress}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-600 font-mono">{consultationProgress}%</span>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-4">
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
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Top/Bottom on mobile, Side by side on desktop: Doctor Video Call Display */}
        <div className="w-full lg:w-1/2 p-2 lg:p-4 h-1/2 lg:h-full">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-3 lg:p-4 bg-gradient-to-r from-green-600 to-blue-600 text-white flex-shrink-0">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Stethoscope size={16} className="lg:w-6 lg:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm lg:text-lg truncate">{appointment.doctorName}</h3>
                  <p className="text-xs lg:text-sm opacity-90">
                    {isDoctorSpeaking ? '発言中...' : '待機中'}
                  </p>
                </div>
              </div>
              <div className="mt-2 lg:mt-3 flex items-center justify-between">
                {isDoctorSpeaking && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
                <button
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`p-1.5 lg:p-2 rounded-full transition-colors ml-auto ${
                    isSoundEnabled 
                      ? 'bg-white/20 text-white hover:bg-white/30' 
                      : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                  }`}
                >
                  {isSoundEnabled ? <Volume2 size={16} className="lg:w-5 lg:h-5" /> : <VolumeX size={16} className="lg:w-5 lg:h-5" />}
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <DoctorVideoCall
                doctorName={appointment.doctorName}
                department={appointment.department}
                isActive={true}
              />
            </div>
          </div>
        </div>

        {/* Top/Bottom on mobile, Side by side on desktop: AI Assistant VRM Avatar */}
        <div className="w-full lg:w-1/2 p-2 lg:p-4 h-1/2 lg:h-full min-h-[250px]">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-3 lg:p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex-shrink-0">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={16} className="lg:w-6 lg:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm lg:text-lg truncate">AIアシスタント</h3>
                  <p className="text-xs lg:text-sm opacity-90">
                    {isAISpeaking ? '発言中...' : '待機中'}
                  </p>
                </div>
              </div>
              <div className="mt-2 lg:mt-3 flex items-center justify-between">
                {isAISpeaking && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 relative min-h-0">
              <VRMViewer ref={vrmViewerRef} isSpeaking={isAISpeaking} />
            </div>
          </div>
        </div>

        {/* Consultation Conversation */}
        <div className="w-full p-2 lg:p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="p-3 lg:p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Stethoscope size={16} className="lg:w-6 lg:h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm lg:text-xl font-bold text-gray-800 truncate">👨‍⚕️ 医師とAIアシスタントの診療面談</h2>
                    <p className="text-xs lg:text-sm text-gray-600 truncate">{appointment.doctorName} • {appointment.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg lg:text-2xl font-bold text-green-600 font-mono">
                    {formatTime(Math.floor((Date.now() - new Date().getTime()) / 1000) + 300)}
                  </div>
                  <p className="text-xs text-gray-500">診療時間</p>
                </div>
              </div>
              
              {/* Patient Info Banner */}
              <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-white" size={12} className="lg:w-4 lg:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-blue-800 truncate">患者: {patient.name}さん</p>
                    <p className="text-xs text-blue-600 truncate">AIアシスタントが代理で医師と面談中</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-2 lg:px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                      🎧 音声のみ参加
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-3 lg:space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-8 lg:py-12">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                    <MessageCircle className="text-blue-600" size={24} className="lg:w-8 lg:h-8" />
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-2">診療開始をお待ちください</h3>
                  <p className="text-sm lg:text-base text-gray-600">AIアシスタントが医師との面談を開始します</p>
                  <p className="text-xs lg:text-sm text-blue-600 mt-2">👤 患者さんは音声で参加、カメラはオフです</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.speaker === 'doctor' ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] lg:max-w-[80%] rounded-2xl px-3 lg:px-4 py-2 lg:py-3 shadow-sm ${
                    message.speaker === 'doctor'
                      ? 'bg-white border-2 border-green-200 text-gray-800'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  }`}>
                    <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
                      <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.speaker === 'doctor' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-white/20 text-white'
                      }`}>
                        {message.speaker === 'doctor' ? (
                          <Stethoscope size={12} className="lg:w-3.5 lg:h-3.5" />
                        ) : (
                          <MessageCircle size={12} className="lg:w-3.5 lg:h-3.5" />
                        )}
                      </div>
                      <span className="text-xs lg:text-sm font-bold opacity-90 truncate">
                        {message.speaker === 'doctor' ? `👨‍⚕️ ${appointment.doctorName}` : '🤖 AIアシスタント'}
                      </span>
                      {message.speaker === 'ai' && isAISpeaking && (
                        <div className="flex gap-1 ml-1 lg:ml-2">
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                      {message.speaker === 'doctor' && isDoctorSpeaking && (
                        <div className="flex gap-1 ml-1 lg:ml-2">
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs lg:text-sm leading-relaxed">{message.text}</p>
                    <p className="text-xs opacity-75 mt-1.5 lg:mt-2 text-right">
                      {message.timestamp.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Status Footer */}
            <div className="p-3 lg:p-4 bg-gradient-to-r from-green-50 to-blue-50 border-t border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs lg:text-sm font-medium text-gray-700">
                    {currentPhase === 'completed' ? '✅ 診療完了' : '🔴 ライブ診療中'}
                  </span>
                </div>
                <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-600">
                  <span>👨‍⚕️ 医師: カメラON</span>
                  <span>👤 患者: 音声のみ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function for time formatting
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

export default DoctorAIConsultation;