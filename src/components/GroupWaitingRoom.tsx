import React, { useState, useEffect } from 'react';
import { Clock, Users, User, Calendar, MessageCircle, CheckCircle, Heart, LogIn, AlertCircle, Star } from 'lucide-react';
import { ConsultationGroup, GroupMember, Patient, QuestionnaireReport } from '../types';
import { AuthUser } from '../lib/auth';
import { getGroupMembers, generateGroupSummary } from '../lib/groupConsultation';
import VRMChatApp from './VRMChatApp';

interface GroupWaitingRoomProps {
  group: ConsultationGroup;
  patient: Patient;
  questionnaireReport: QuestionnaireReport;
  onConsultationStart: () => void;
  onShowLogin: () => void;
  onLogout: () => void;
  userAccount: AuthUser | null;
}

const GroupWaitingRoom: React.FC<GroupWaitingRoomProps> = ({ 
  group, 
  patient, 
  questionnaireReport,
  onConsultationStart, 
  onShowLogin, 
  onLogout, 
  userAccount 
}) => {
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupSummary, setGroupSummary] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(60); // 1分 = 60秒
  const [showChat, setShowChat] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  useEffect(() => {
    loadGroupMembers();
    loadGroupSummary();
    // 初期値は既に60秒に設定済み
    
    // 10秒ごとにメンバー情報を更新
    const interval = setInterval(() => {
      loadGroupMembers();
    }, 10000);

    return () => clearInterval(interval);
  }, [group.id]);

  useEffect(() => {
    // 1秒ごとに残り時間を更新
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onConsultationStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onConsultationStart]);

  const loadGroupMembers = async () => {
    try {
      const members = await getGroupMembers(group.id);
      setGroupMembers(members);
      setIsLoadingMembers(false);
    } catch (error) {
      console.error('Error loading group members:', error);
      setIsLoadingMembers(false);
    }
  };

  const loadGroupSummary = async () => {
    try {
      const summary = await generateGroupSummary(group.id);
      setGroupSummary(summary);
    } catch (error) {
      console.error('Error loading group summary:', error);
    }
  };

  const calculateTimeRemaining = () => {
    // 固定で60秒（1分）からカウントダウン開始
    if (timeRemaining === 0) {
      setTimeRemaining(60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalTime = 60; // 1分（60秒）
    return Math.max(0, ((totalTime - timeRemaining) / totalTime) * 100);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600 bg-red-100';
    if (priority >= 3) return 'text-orange-600 bg-orange-100';
    if (priority >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return '高';
    if (priority >= 3) return '中高';
    if (priority >= 2) return '中';
    return '低';
  };

  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <VRMChatApp 
          isQuestionnaire={false}
          onBackToWaiting={() => setShowChat(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
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
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">グループ診療待機室</h1>
                <p className="text-gray-600">症状が似た患者さんとグループで診療を受けます</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600 font-mono">{formatTime(timeRemaining)}</div>
              <p className="text-sm text-gray-500">診療開始まで</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2" size={20} />
                グループ診療詳細
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">担当医師</p>
                  <p className="font-semibold text-gray-800">{group.doctorName}</p>
                  <p className="text-sm text-gray-500">{group.department} • AI選択</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">症状カテゴリ</p>
                  <p className="font-semibold text-gray-800">{group.symptomCategory}</p>
                  <p className="text-sm text-gray-500">AI自動グループ化</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">診療予定時刻</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(group.scheduledTime).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">参加者数</p>
                  <p className="font-semibold text-gray-800">
                    {groupMembers.length} / {group.maxPatients} 名
                  </p>
                  <p className="text-sm text-gray-500">AI最適化グループ</p>
                </div>
              </div>
            </div>

            {/* Group Members */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="mr-2" size={20} />
                グループメンバー
              </h2>
              
              {isLoadingMembers ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">メンバー情報を読み込み中...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        member.patientId === patient.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="text-white" size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-800">
                                {member.patientId === patient.id ? 'あなた' : `患者${index + 1}`}
                              </h3>
                              {member.patientId === patient.id && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                  あなた
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {member.questionnaireSummary?.mainSymptoms || '症状情報なし'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(member.priorityLevel)}`}>
                            優先度: {getPriorityLabel(member.priorityLevel)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {new Date(member.joinedAt).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {groupMembers.length < group.maxPatients && (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-gray-500 text-sm">
                        他の患者さんの参加をお待ちしています...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* How Group Consultation Works */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">グループ診療の流れ</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">AIアバターが代表として医師と面談</h3>
                    <p className="text-gray-600 text-sm">グループ全体の症状をAIアバターがまとめて医師に報告します</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-purple-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">医師による総合診断</h3>
                    <p className="text-gray-600 text-sm">医師がグループ全体の症状を分析し、診断と治療方針を決定します</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">個別の治療指示</h3>
                    <p className="text-gray-600 text-sm">各患者さんに合わせた個別の治療指示と処方箋を発行します</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">待機中のアクション</h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowChat(true)}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  AIアバターと会話
                </button>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-blue-600" size={20} />
                    <h3 className="font-medium text-blue-800">問診完了</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    あなたの問診情報はグループに共有されました
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-yellow-600" size={20} />
                    <h3 className="font-medium text-yellow-800">グループ診療について</h3>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 似た症状の患者さんと一緒に診療</li>
                    <li>• AIアバターが代表として医師と面談</li>
                    <li>• 効率的で質の高い診療を提供</li>
                    <li>• 個別の治療指示も受けられます</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="text-green-600" size={20} />
                    <h3 className="font-medium text-green-800">グループ診療のメリット</h3>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 待ち時間の短縮</li>
                    <li>• 類似症例からの学び</li>
                    <li>• 医師の専門知識の共有</li>
                    <li>• コスト効率の向上</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupWaitingRoom;