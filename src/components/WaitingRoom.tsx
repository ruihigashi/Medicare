import React, { useState, useEffect } from 'react';
import { Clock, User, Calendar, MessageCircle, CheckCircle, Heart, LogIn } from 'lucide-react';
import { Appointment, Patient, QuestionnaireReport, ConsultationGroup } from '../types';
import { AuthUser } from '../lib/auth';
import { 
  findOrCreateConsultationGroup, 
  addMemberToGroup,
  saveQuestionnaireToDatabase,
  saveGroupSessionToDatabase,
  saveGroupMemberToDatabase,
  categorizeSymptoms,
  calculatePriority
} from '../lib/groupConsultation';
import VRMChatApp from './VRMChatApp';
import GroupWaitingRoom from './GroupWaitingRoom';

interface WaitingRoomProps {
  appointment: Appointment;
  patient: Patient;
  onConsultationStart: () => void;
  onShowLogin: () => void;
  onLogout: () => void;
  userAccount: AuthUser | null;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ appointment, patient, onConsultationStart, onShowLogin, onLogout, userAccount }) => {
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [showChat, setShowChat] = useState(true); // Start with AI chat immediately
  const [questionnaireReport, setQuestionnaireReport] = useState<QuestionnaireReport | null>(null);
  const [consultationGroup, setConsultationGroup] = useState<ConsultationGroup | null>(null);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [showGroupAssignment, setShowGroupAssignment] = useState(false);
  const [showInitialWaiting, setShowInitialWaiting] = useState(false); // Skip initial waiting

  useEffect(() => {
    // 初期待機画面を表示するため、タイマーを削除
    /*
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
    */
  }, [onConsultationStart]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((15 * 60 - timeRemaining) / (15 * 60)) * 100;
  };

  const handleQuestionnaireSent = async (report: QuestionnaireReport) => {
    setQuestionnaireReport(report);
    setShowChat(false);
    setShowInitialWaiting(false);
    
    // 問診完了後、データベースに保存してグループに参加
    await joinConsultationGroup(report);
  };

  const joinConsultationGroup = async (report: QuestionnaireReport) => {
    setShowGroupAssignment(true);
    setIsJoiningGroup(true);
    
    try {
      // 1. 問診票をデータベースに保存
      console.log('Saving questionnaire to database...');
      const questionnaireId = await saveQuestionnaireToDatabase(report, patient, appointment);
      if (!questionnaireId) {
        throw new Error('Failed to save questionnaire');
      }
      
      // 2. 症状カテゴリを決定
      const category = categorizeSymptoms(appointment.symptoms);
      console.log('Determined category:', category);
      
      // 3. 適切なグループを見つけるか作成
      const group = await findOrCreateConsultationGroup(report, appointment);
      if (!group) {
        throw new Error('Failed to create or find consultation group');
      }
      
      // 4. グループセッションをデータベースに保存（新規作成の場合）
      console.log('Saving group session to database...');
      const groupSessionId = await saveGroupSessionToDatabase(group, category);
      if (!groupSessionId) {
        console.warn('Failed to save group session, using existing group');
      }
      
      // 5. グループメンバーとして患者を追加
      const priorityLevel = calculatePriority(report);
      console.log('Adding patient to group with priority:', priorityLevel);
      const memberId = await saveGroupMemberToDatabase(
        groupSessionId || group.id,
        patient.id,
        questionnaireId,
        priorityLevel
      );
      
      if (!memberId) {
        console.warn('Failed to save group member');
      }
      
      console.log('Successfully joined consultation group:', {
        groupId: group.id,
        questionnaireId,
        memberId,
        category,
        priorityLevel
      });
      
      setConsultationGroup(group);
      
      // 3秒後にグループ割り振り画面を非表示
      setTimeout(() => {
        setShowGroupAssignment(false);
        setIsJoiningGroup(false);
      }, 3000);
    } catch (error) {
      console.error('Error joining consultation group:', error);
      
      // エラーの場合はフォールバック用のモックグループを作成
      const mockGroup: ConsultationGroup = {
        id: `group_${Date.now()}`,
        doctorId: 'dr_001',
        doctorName: '田中 一郎',
        department: '内科',
        symptomCategory: '一般内科',
        symptomKeywords: ['一般診療'],
        status: 'waiting',
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        maxPatients: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setConsultationGroup(mockGroup);
      setShowGroupAssignment(false);
      setIsJoiningGroup(false);
    }
  };

  // Group assignment display
  if (showGroupAssignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-2xl w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {!consultationGroup ? 'AI分析中...' : 'グループが決定しました'}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {!consultationGroup 
                ? '症状を分析して適切なグループを作成しています'
                : '適切な医師による診療グループに割り振られました'
              }
            </p>
          </div>

          {!consultationGroup ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ 処理中</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-700">症状を確認中...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-gray-700">医師を選択中...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-gray-700">グループを作成中...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{consultationGroup.symptomCategory}グループ</h2>
                <p className="text-gray-700 mb-6">適切な医師による診療を行います</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">👨‍⚕️ 担当医師</h3>
                    <p className="text-gray-700">{consultationGroup.doctorName}</p>
                    <p className="text-gray-500 text-sm">{consultationGroup.department}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">👥 グループサイズ</h3>
                    <p className="text-gray-700">最大 {consultationGroup.maxPatients} 名</p>
                    <p className="text-gray-500 text-sm">効率的な診療</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  まもなくグループ診療室に移動します...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // グループ診療画面を表示
  if (consultationGroup && questionnaireReport && !showGroupAssignment) {
    return (
      <GroupWaitingRoom
        group={consultationGroup}
        patient={patient}
        questionnaireReport={questionnaireReport}
        onConsultationStart={onConsultationStart}
        onShowLogin={onShowLogin}
        onLogout={onLogout}
        userAccount={userAccount}
      />
    );
  }

  // AI問診画面
  if (showChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <VRMChatApp 
          isQuestionnaire={true}
          appointment={appointment}
          patient={patient}
          onBackToWaiting={() => setShowChat(false)}
          onQuestionnaireSent={handleQuestionnaireSent}
        />
      </div>
    );
  }

  // 初期待機画面（問診前）
  if (showInitialWaiting) {
    return (
      <div className="min-h-screen bg-gray-50">
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

        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI問診待機室</h1>
                  <p className="text-gray-600">AI問診を開始してください</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Appointment Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  予約詳細
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600">診療システム</p>
                    <p className="font-semibold text-blue-800">AI診療システム</p>
                    <p className="text-sm text-blue-600">自動グループ診療</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600">予約日時</p>
                    <p className="font-semibold text-gray-800">{appointment.date}</p>
                    <p className="text-sm text-gray-500">{appointment.time}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 md:col-span-2">
                    <p className="text-sm text-gray-600">症状・相談内容</p>
                    <p className="font-medium text-gray-800">{appointment.symptoms || '特になし'}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">AI診療の流れ</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">AI問診</h3>
                      <p className="text-gray-600 text-sm">AIアバターとの自然な会話で症状を詳しく聞き取ります。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">グループ診療</h3>
                      <p className="text-gray-600 text-sm">似た症状の患者さんとグループを組んで効率的な診療を行います。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-purple-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">個別診断</h3>
                      <p className="text-gray-600 text-sm">各患者さんに合わせた個別の治療指示と処方箋を発行します。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">次のステップ</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setShowChat(true)}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 text-lg"
                  >
                    <MessageCircle size={20} />
                    AI問診を開始する
                  </button>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-800 mb-2">AI診療のメリット</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 24時間いつでも問診開始</li>
                      <li>• AIによる最適な医師選択</li>
                      <li>• 効率的なグループ診療</li>
                      <li>• 個別の詳細な診断結果</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-800 mb-2">問診について</h3>
                    <p className="text-sm text-green-700">
                      3Dアバターとの自然な会話で症状を詳しくお聞きします。リラックスしてお答えください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // フォールバック（通常は表示されない）
  return null;
};

export default WaitingRoom;