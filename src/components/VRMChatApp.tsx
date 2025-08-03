import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, ArrowLeft, FileText, CheckCircle, Volume2, VolumeX, Download, Eye, Check, User, Mic, MicOff } from 'lucide-react';
import VRMViewer from './VRMViewer';
import { Appointment, Patient, MedicalQuestion, QuestionnaireResponse, Message, QuestionnaireReport } from '../types';

// Google APIs configuration
const GOOGLE_TTS_API_KEY = 'AIzaSyBsTVNBMbMySeftSt39ig6HmK78NCIWD-4';
const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const GEMINI_API_KEY = 'AIzaSyBwMiahe8ZgINmTT_xKtS4ec8Q7oloeX6s';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

interface VRMChatAppProps {
  isQuestionnaire?: boolean;
  appointment?: Appointment;
  patient?: Patient;
  onBackToWaiting?: () => void;
  onQuestionnaireSent?: (report: QuestionnaireReport) => void;
}

// Medical questionnaire data
const medicalQuestions: MedicalQuestion[] = [
  {
    id: 'symptoms_main',
    question: '今日はどのような症状でお困りですか？詳しく教えてください。',
    type: 'text',
    required: true,
    category: 'symptoms'
  },
  {
    id: 'symptoms_duration',
    question: 'その症状はいつ頃から始まりましたか？',
    type: 'choice',
    options: ['今日から', '2-3日前から', '1週間前から', '1ヶ月前から', 'それ以上前から'],
    required: true,
    category: 'symptoms'
  },
  {
    id: 'pain_scale',
    question: '痛みがある場合、10段階でどの程度ですか？（10が最も痛い状態です）',
    type: 'scale',
    required: false,
    category: 'symptoms'
  },
  {
    id: 'fever',
    question: '発熱はありますか？体温を測られましたか？',
    type: 'boolean',
    required: true,
    category: 'symptoms'
  },
  {
    id: 'medications',
    question: '現在服用中のお薬やサプリメントはありますか？あれば詳しく教えてください。',
    type: 'text',
    required: true,
    category: 'current_condition'
  },
  {
    id: 'allergies',
    question: '薬物アレルギーや食物アレルギーはありますか？',
    type: 'text',
    required: true,
    category: 'history'
  },
  {
    id: 'previous_treatment',
    question: '同じような症状で以前に治療を受けたことはありますか？',
    type: 'boolean',
    required: true,
    category: 'history'
  }
];

const VRMChatApp: React.FC<VRMChatAppProps> = ({ 
  isQuestionnaire = false, 
  appointment, 
  patient, 
  onBackToWaiting,
  onQuestionnaireSent
}) => {
  // Get symptom information for AI context
  const getSymptomContext = () => {
    if (!appointment?.symptoms) return '';
    return `患者が事前に入力した症状情報: ${appointment.symptoms}`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: isQuestionnaire 
        ? `こんにちは、${patient?.name}さん！私は問診アシスタントのAIです。${appointment?.symptoms ? `${appointment.symptoms}の症状でお困りとのことですね。` : ''}診療前に、いくつか質問をさせていただきますね。リラックスしてお答えください。準備はよろしいですか？`
        : 'こんにちは！私はあなたの3Dアバターです。何でも話しかけてくださいね！',
      sender: 'avatar',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<QuestionnaireResponse[]>([]);
  const [isQuestionnaireComplete, setIsQuestionnaireComplete] = useState(false);
  const [showQuestionnaireReview, setShowQuestionnaireReview] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<QuestionnaireReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [conversationContext, setConversationContext] = useState<string>('');
  const [conversationTurnCount, setConversationTurnCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const vrmViewerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'ja-JP';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
      setIsVoiceSupported(true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isQuestionnaire && currentQuestionIndex < medicalQuestions.length && !isQuestionnaireComplete) {
      // Ask the next question after a delay
      const timer = setTimeout(() => {
        askNextQuestion();
      }, 2000);
      return () => clearTimeout(timer);
    } else if (isQuestionnaire && conversationTurnCount >= 10 && !isQuestionnaireComplete && !showQuestionnaireReview) {
      // Auto-complete questionnaire after sufficient conversation
      setTimeout(() => {
        completeQuestionnaire();
      }, 1000);
    }
  }, [currentQuestionIndex, isQuestionnaire, isQuestionnaireComplete, conversationTurnCount, showQuestionnaireReview]);

  const askNextQuestion = async () => {
    if (currentQuestionIndex >= medicalQuestions.length) {
      completeQuestionnaire();
      return;
    }

    const question = medicalQuestions[currentQuestionIndex];
    
    // Use Gemini to make the question more natural and contextual
    const contextualQuestion = await generateContextualQuestion(question);
    
    const questionMessage: Message = {
      id: `question_${currentQuestionIndex}`,
      text: contextualQuestion,
      sender: 'avatar',
      timestamp: new Date(),
      questionId: question.id,
      isQuestionnaireRelated: true
    };

    setMessages(prev => [...prev, questionMessage]);
    if (isSoundEnabled) {
      speakText(contextualQuestion);
    }
  };

  const generateContextualQuestion = async (question: MedicalQuestion): Promise<string> => {
    try {
      const symptomContext = getSymptomContext();
      const context = [
        `患者名: ${patient?.name}`,
        `診療科: ${appointment?.department}`,
        symptomContext,
        conversationContext
      ].filter(Boolean).join('\n');
      
      const prompt = `
あなたは優しく親しみやすい医療問診AIアシスタントです。以下の医療質問を、患者さんがリラックスして答えられるよう、自然で親しみやすい日本語に変換してください。

患者情報とこれまでの会話:
${context}

元の質問: ${question.question}
質問カテゴリ: ${question.category}

要件:
- 親しみやすく、優しい口調で
- 医療専門用語は避けて、分かりやすい言葉で
- 患者の不安を和らげるような表現で
- 事前に入力された症状情報があれば、それを踏まえた質問にする
- 150文字以内で簡潔に
- 質問の本質は変えずに

変換された質問:`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          console.warn('Gemini API quota exceeded (429). Using fallback question. Free tier limit: 50 requests/day. Consider upgrading your plan for higher limits.');
        } else {
          console.error('Gemini API response error:', response.status, errorText);
        }
        return getContextualQuestionFallback(question);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return generatedText || question.question;
    } catch (error) {
      console.error('Error generating contextual question:', error);
      return getContextualQuestionFallback(question);
    }
  };

  const getContextualQuestionFallback = (question: MedicalQuestion): string => {
    const symptomInfo = appointment?.symptoms ? `${appointment.symptoms}の症状について、` : '';
    
    const fallbackQuestions: { [key: string]: string } = {
      'symptoms_main': `${patient?.name}さん、${symptomInfo}今日はどのような症状でお困りでしょうか？どんな小さなことでも構いませんので、詳しくお聞かせください。`,
      'symptoms_duration': `${symptomInfo}その症状はいつ頃から始まりましたか？覚えている範囲で結構です。`,
      'pain_scale': '痛みがある場合、どの程度の痛みでしょうか？我慢できる程度から、とても辛い程度まで、お聞かせください。',
      'fever': '熱っぽさや発熱はありますか？体温を測られていれば教えてください。',
      'medications': '現在、お薬やサプリメントを飲まれていますか？お薬手帳があれば参考にしてください。',
      'allergies': 'お薬や食べ物でアレルギーをお持ちですか？過去に何かアレルギー反応を起こしたことはありますか？',
      'previous_treatment': `${symptomInfo}同じような症状で、以前に病院にかかったことはありますか？`
    };
    
    return fallbackQuestions[question.id] || `${symptomInfo}${question.question}について、お聞かせください。`;
  };
  const completeQuestionnaire = async () => {
    const completionText = await generateCompletionMessage();
    
    const completionMessage: Message = {
      id: 'questionnaire_complete',
      text: completionText,
      sender: 'avatar',
      timestamp: new Date(),
      isQuestionnaireRelated: true
    };

    setMessages(prev => [...prev, completionMessage]);
    setIsQuestionnaireComplete(true);
    if (isSoundEnabled) {
      speakText(completionText);
    }

    // Generate questionnaire report after a delay
    setTimeout(() => {
      generateQuestionnaireReport();
    }, 3000);
  };

  const generateQuestionnaireReport = async () => {
    if (!patient || !appointment) return;

    setIsGeneratingReport(true);

    try {
      // Extract responses from conversation
      const responses: QuestionnaireResponse[] = [];
      const userMessages = messages.filter(m => m.sender === 'user');
      
      userMessages.forEach((msg, index) => {
        responses.push({
          questionId: `conversation_${index}`,
          answer: msg.text,
          timestamp: msg.timestamp
        });
      });

      // Generate summary using Gemini
      const summary = await generateMedicalSummary(userMessages.map(m => m.text).join('\n'));

      const report: QuestionnaireReport = {
        id: Date.now().toString(),
        patientId: patient.id,
        appointmentId: appointment.id,
        responses,
        summary,
        generatedAt: new Date()
      };

      setGeneratedReport(report);
      setShowQuestionnaireReview(true);
      setIsGeneratingReport(false);
    } catch (error) {
      console.error('Error generating questionnaire report:', error);
      setIsGeneratingReport(false);
    }
  };

  const generateMedicalSummary = async (conversationText: string) => {
    try {
      const symptomContext = getSymptomContext();
      const prompt = `
以下は患者さんとAIアシスタントの会話内容です。この会話から医師が診療に必要な情報を抽出して、構造化された問診票を作成してください。

${symptomContext}

会話内容:
${conversationText}

患者情報:
- 名前: ${patient?.name}
- 診療科: ${appointment?.department}
- 予約日時: ${appointment?.date} ${appointment?.time}

以下の形式でJSONとして回答してください:
{
  "mainSymptoms": "主な症状（具体的に）",
  "duration": "症状の持続期間",
  "severity": "症状の重症度（軽度/中等度/重度）",
  "currentMedications": "現在服用中の薬（なしの場合は「なし」）",
  "allergies": "アレルギー情報（なしの場合は「なし」）",
  "previousTreatment": "同様症状での過去の治療歴",
  "additionalNotes": "その他医師に伝えるべき重要な情報"
}`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          console.warn('Gemini API quota exceeded (429). Using fallback summary. Free tier limit: 50 requests/day. Consider upgrading your plan for higher limits.');
        } else {
          console.error('Gemini API error in medical summary:', response.status, errorText);
        }
        return generateFallbackSummary(conversationText);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('Failed to parse JSON response, using fallback summary');
      return generateFallbackSummary(conversationText);
    } catch (error) {
      console.error('Error generating medical summary:', error);
      return generateFallbackSummary(conversationText);
    }
  };

  const generateFallbackSummary = (conversationText: string) => {
    // 簡単なキーワード抽出による要約生成
    const allText = `${appointment?.symptoms || ''} ${conversationText}`.toLowerCase();
    
    // 症状関連のキーワード
    const symptomKeywords = ['痛い', '痛み', '熱', '咳', '頭痛', '腹痛', '吐き気', 'だるい', '疲れ'];
    const foundSymptoms = symptomKeywords.filter(keyword => allText.includes(keyword));
    
    // 期間関連のキーワード
    let duration = '不明';
    if (allText.includes('今日') || allText.includes('今朝')) duration = '今日から';
    else if (allText.includes('昨日') || allText.includes('2日') || allText.includes('3日')) duration = '2-3日前から';
    else if (allText.includes('週間') || allText.includes('1週間')) duration = '1週間前から';
    else if (allText.includes('月') || allText.includes('ヶ月')) duration = '1ヶ月前から';
    
    // 薬関連のキーワード
    const medicationKeywords = ['薬', '服用', '飲んで', '処方'];
    const hasMedications = medicationKeywords.some(keyword => allText.includes(keyword));
    
    // 事前入力症状を含める
    const preInputSymptoms = appointment?.symptoms ? `事前入力症状: ${appointment.symptoms}` : '';
    const mainSymptoms = [preInputSymptoms, foundSymptoms.length > 0 ? foundSymptoms.join('、') + 'の症状' : ''].filter(Boolean).join('、') || '会話内容から症状を確認してください';
    
    return {
      mainSymptoms: mainSymptoms,
      duration: duration,
      severity: allText.includes('ひどい') || allText.includes('辛い') ? '中等度〜重度' : '要確認',
      currentMedications: hasMedications ? '服用中（詳細は会話内容を確認）' : allText.includes('ない') || allText.includes('飲んでいない') ? 'なし' : '要確認',
      allergies: allText.includes('アレルギー') ? '有り（詳細は会話内容を確認）' : allText.includes('ない') ? 'なし' : '要確認',
      previousTreatment: allText.includes('病院') || allText.includes('治療') ? '有り（詳細は会話内容を確認）' : '要確認',
      additionalNotes: 'AIサービス制限のため簡易解析。詳細は会話履歴をご確認ください。'
    };
  };

  const generateCompletionMessage = async (): Promise<string> => {
    try {
      const symptomContext = getSymptomContext();
      const prompt = `
患者さんの問診が完了しました。以下の情報を踏まえて、温かく安心感のある完了メッセージを作成してください。

患者名: ${patient?.name}
診療科: ${appointment?.department}
担当医: ${appointment?.doctorName}
${symptomContext}

要件:
- 感謝の気持ちを込めて
- 患者さんを安心させる内容で
- 次のステップ（医師との診療）について簡潔に説明
- 事前に入力された症状があれば、それに触れる
- 200文字以内で
- 親しみやすい口調で

完了メッセージ:`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          console.warn('Gemini API quota exceeded (429). Using fallback completion message. Free tier limit: 50 requests/day. Consider upgrading your plan for higher limits.');
        } else {
          console.error('Gemini API response error:', response.status, errorText);
        }
        return getCompletionMessageFallback();
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return generatedText || getCompletionMessageFallback();
    } catch (error) {
      console.error('Error generating completion message:', error);
      return getCompletionMessageFallback();
    }
  };

  const getCompletionMessageFallback = (): string => {
    const messages = [
      `${patient?.name}さん、お疲れさまでした！問診票が完成しました。${appointment?.doctorName}先生との診療まで、もう少しお待ちください。`,
      'ありがとうございました！問診票が完成しました。この情報は担当医師と共有され、より良い診療に役立てられます。診療開始まで、もう少しお待ちください。',
      'お話しいただき、ありがとうございました。問診内容をまとめましたので、医師が事前に確認して診療に備えます。お疲れさまでした。'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setConversationTurnCount(prev => prev + 1);

    // Update conversation context
    setConversationContext(prev => prev + `\n患者: ${currentInput}`);

    if (isQuestionnaire && currentQuestionIndex < medicalQuestions.length && !isQuestionnaireComplete) {
      // Handle questionnaire response
      const currentQuestion = medicalQuestions[currentQuestionIndex];
      const response: QuestionnaireResponse = {
        questionId: currentQuestion.id,
        answer: currentInput,
        timestamp: new Date()
      };

      setQuestionnaireResponses(prev => [...prev, response]);
      setCurrentQuestionIndex(prev => prev + 1);

      // Generate acknowledgment using Gemini
      setTimeout(async () => {
        const acknowledgment = await generateAcknowledgment(currentInput, currentQuestion);
        const acknowledgmentMessage: Message = {
          id: `ack_${currentQuestionIndex}`,
          text: acknowledgment,
          sender: 'avatar',
          timestamp: new Date(),
          isQuestionnaireRelated: true
        };
        setMessages(prev => [...prev, acknowledgmentMessage]);
        if (isSoundEnabled) {
          speakText(acknowledgment);
        }
      }, 1000);
    } else {
      // Regular chat mode with Gemini
      setIsTyping(true);
      setTimeout(async () => {
        const avatarResponse = await generateAvatarResponse(currentInput);
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: avatarResponse,
          sender: 'avatar',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, responseMessage]);
        setIsTyping(false);
        
        if (isSoundEnabled) {
          speakText(avatarResponse);
        }
      }, 1000 + Math.random() * 2000);
    }
  };

  const generateAcknowledgment = async (userInput: string, question: MedicalQuestion): Promise<string> => {
    try {
      const symptomContext = getSymptomContext();
      const prompt = `
患者さんが医療問診に答えてくれました。以下の回答に対して、共感的で温かい確認メッセージを作成してください。

${symptomContext}

質問: ${question.question}
患者の回答: ${userInput}

要件:
- 共感的で理解を示す
- 患者を安心させる
- 50文字以内で簡潔に
- 親しみやすい口調で
- 次の質問に自然に繋がるように

確認メッセージ:`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          console.warn('Gemini API quota exceeded (429). Using fallback acknowledgment. Free tier limit: 50 requests/day. Consider upgrading your plan for higher limits.');
        } else {
          console.error('Gemini API response error:', response.status, errorText);
        }
        return getAcknowledgmentFallback(userInput, question);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return generatedText || getAcknowledgmentFallback(userInput, question);
    } catch (error) {
      console.error('Error generating acknowledgment:', error);
      return getAcknowledgmentFallback(userInput, question);
    }
  };

  const getAcknowledgmentFallback = (userInput: string, question: MedicalQuestion): string => {
    const acknowledgments = [
      'ありがとうございます。よく分かりました。',
      'なるほど、承知いたしました。',
      'お答えいただき、ありがとうございます。',
      '分かりました。記録させていただきますね。',
      'そうですね、承知いたしました。',
      'お聞かせいただき、ありがとうございます。'
    ];
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  };

  const generateAvatarResponse = async (userInput: string): Promise<string> => {
    try {
      const symptomContext = getSymptomContext();
      const prompt = `
あなたは親しみやすい3DアバターのAIアシスタントです。患者さんと自然な会話をしてください。

${symptomContext}

患者の発言: ${userInput}
会話の文脈: ${conversationContext}

要件:
- 親しみやすく、温かい口調で
- 患者さんの気持ちに寄り添う
- 適度に質問を返して会話を続ける
- 事前に入力された症状情報があれば、それを考慮した返答をする
- 150文字以内で
- 医療的なアドバイスは避ける

返答:`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
          console.warn('Gemini API quota exceeded (429). Using fallback avatar response. Free tier limit: 50 requests/day. Consider upgrading your plan for higher limits.');
        } else {
          console.error('Gemini API response error:', response.status, errorText);
        }
        return getAvatarResponseFallback(userInput);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      setConversationContext(prev => prev + `\nAI: ${generatedText}`);
      
      return generatedText || getAvatarResponseFallback(userInput);
    } catch (error) {
      console.error('Error generating avatar response:', error);
      return getAvatarResponseFallback(userInput);
    }
  };

  const getAvatarResponseFallback = (userInput: string): string => {
    const responses = [
      'それは面白いですね！もっと詳しく教えてください。',
      'なるほど、よく分かります。私も同じように思います。',
      'とても興味深い話ですね。他にも何かありますか？',
      'あなたと話していると楽しいです。',
      'そうなんですね。お聞かせいただき、ありがとうございます。',
      'よく分かります。他にも何かお話しいただけますか？'
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    setConversationContext(prev => prev + `\nAI: ${response}`);
    return response;
  };

  const speakText = async (text: string) => {
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    try {
      setIsSpeaking(true);
      
      // Start mouth animation
      if (vrmViewerRef.current) {
        vrmViewerRef.current.startSpeaking();
      }

      const response = await fetch(`${GOOGLE_TTS_URL}?key=${GOOGLE_TTS_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'ja-JP',
            name: 'ja-JP-Neural2-C',
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      const audioBlob = new Blob([
        Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mp3' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        if (vrmViewerRef.current) {
          vrmViewerRef.current.stopSpeaking();
        }
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        if (vrmViewerRef.current) {
          vrmViewerRef.current.stopSpeaking();
        }
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
      if (vrmViewerRef.current) {
        vrmViewerRef.current.stopSpeaking();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendToDoctor = () => {
    if (!generatedReport) return;

    const updatedReport = {
      ...generatedReport,
      sentToDoctorAt: new Date()
    };

    setGeneratedReport(updatedReport);
    
    if (onQuestionnaireSent) {
      onQuestionnaireSent(updatedReport);
    }

    // Don't hide review immediately - let parent component handle transition
  };

  const startVoiceRecognition = () => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  // Questionnaire Review Modal
  if (showQuestionnaireReview && generatedReport) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white shadow-2xl border border-gray-200 rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={24} />
                <div>
                  <h1 className="text-xl font-bold">問診票</h1>
                  <p className="text-blue-100 text-xs">MediCare Online</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p>作成日時</p>
                <p className="font-mono">{generatedReport.generatedAt.toLocaleString('ja-JP')}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
            {/* Patient Info */}
            <div className="border-b border-gray-200 pb-3">
              <h2 className="text-base font-semibold text-gray-800 mb-2">患者情報</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">患者ID:</span>
                  <span className="ml-2 font-mono">{generatedReport.patientId}</span>
                </div>
                <div>
                  <span className="text-gray-600">予約ID:</span>
                  <span className="ml-2 font-mono">{generatedReport.appointmentId}</span>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1 text-xs">主な症状</h3>
                  <p className="text-gray-700 text-xs leading-relaxed">{generatedReport.summary.mainSymptoms}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1 text-xs">症状の持続期間</h3>
                  <p className="text-gray-700 text-xs">{generatedReport.summary.duration}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1 text-xs">重症度</h3>
                  <p className="text-gray-700 text-xs">{generatedReport.summary.severity}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1 text-xs">現在の服薬</h3>
                  <p className="text-gray-700 text-xs">{generatedReport.summary.currentMedications}</p>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1 text-xs">アレルギー情報</h3>
                  <p className="text-gray-700 text-xs">{generatedReport.summary.allergies}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-1 text-xs">過去の治療歴</h3>
                  <p className="text-gray-700 text-xs">{generatedReport.summary.previousTreatment}</p>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <h3 className="font-semibold text-gray-800 mb-1 text-xs">その他の情報</h3>
                  <p className="text-gray-700 text-xs leading-relaxed">{generatedReport.summary.additionalNotes}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-3 mt-4">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div>
                  <p>AI問診システム生成</p>
                  <p>MediCare Online © 2024</p>
                </div>
                <div className="text-right">
                  <p>問診回答数: {generatedReport.responses.length}件</p>
                  <p>生成時刻: {generatedReport.generatedAt.toLocaleTimeString('ja-JP')}</p>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center p-4 bg-gray-50 rounded-b-lg border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => setShowQuestionnaireReview(false)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-sm"
            >
              修正する
            </button>
            
            <button
              onClick={handleSendToDoctor}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md text-sm"
            >
              <Check size={16} />
              医師に送信する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* 3D Viewer Section - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block flex-1 relative">
        <VRMViewer ref={vrmViewerRef} isSpeaking={isSpeaking} />
        
        {/* Floating controls */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`w-12 h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 ${
              isSoundEnabled 
                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
            }`}
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      {/* Enhanced Chat Panel */}
      <div className="w-full lg:w-[480px] bg-white border-l border-gray-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-blue-50">
          {isQuestionnaire && onBackToWaiting && (
            <button
              onClick={onBackToWaiting}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group hover:bg-gray-100 px-3 py-2 rounded-md"
            >
              <ArrowLeft size={16} />
              待機室に戻る
            </button>
          )}
          
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Mobile Avatar - Small 3D viewer */}
            <div className="lg:hidden w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-white shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden">
                <VRMViewer ref={vrmViewerRef} isSpeaking={isSpeaking} />
              </div>
              {isSpeaking && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse border-2 border-white">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              )}
            </div>
            
            {/* Desktop Icon */}
            <div className="hidden lg:block relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                {isQuestionnaire ? <FileText className="text-white" size={24} /> : <MessageCircle className="text-white" size={24} />}
              </div>
              {isSpeaking && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
                {isQuestionnaire ? '問診アシスタント' : 'AIアバター'}
              </h2>
              <p className="text-gray-600 text-xs lg:text-sm flex items-center gap-2 mt-1">
                {isSpeaking ? (
                  <>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="font-medium">お話し中...</span>
                  </>
                ) : isTyping ? (
                  <>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="font-medium">考え中...</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">お話しできます</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          {isQuestionnaire && (
            <div className="mt-4 lg:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs lg:text-sm text-gray-600 font-medium">
                  質問 {Math.min(currentQuestionIndex + 1, medicalQuestions.length)} / {medicalQuestions.length}
                </span>
                {isQuestionnaireComplete && (
                  <div className="flex items-center gap-1 lg:gap-2 text-green-700 bg-green-100 px-2 lg:px-3 py-1 rounded-full">
                    <CheckCircle size={12} className="lg:w-4 lg:h-4" />
                    <span className="text-xs lg:text-sm font-medium">完了</span>
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 lg:h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${isQuestionnaireComplete ? 100 : (currentQuestionIndex / medicalQuestions.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-gray-50 max-h-[calc(100vh-400px)]">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {message.sender === 'avatar' && (
                <div className="flex-shrink-0 mr-3 mt-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    {isQuestionnaire ? <FileText className="text-white" size={14} /> : <MessageCircle className="text-white" size={14} />}
                  </div>
                </div>
              )}
              <div
                className={`max-w-[340px] rounded-2xl px-5 py-4 shadow-lg transition-all duration-200 group-hover:shadow-xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white ml-12 rounded-br-sm'
                    : message.isQuestionnaireRelated
                      ? 'bg-green-50 text-gray-800 mr-12 border border-green-200 rounded-bl-sm'
                      : 'bg-white text-gray-800 mr-12 border border-gray-200 rounded-bl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed font-medium break-words">{message.text}</p>
                <p className="text-xs opacity-75 mt-3 flex items-center gap-1">
                  {message.timestamp.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {message.sender === 'user' && <span className="text-xs ml-1">✓</span>}
                </p>
              </div>
              {message.sender === 'user' && (
                <div className="flex-shrink-0 ml-3 mt-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="text-white" size={14} />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in group">
              <div className="flex-shrink-0 mr-3 mt-1">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  {isQuestionnaire ? <FileText className="text-white" size={14} /> : <MessageCircle className="text-white" size={14} />}
                </div>
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 mr-12 border border-gray-200 rounded-bl-sm shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input */}
        <div className="flex-shrink-0 p-4 lg:p-6 border-t border-gray-200 bg-white">
          {isQuestionnaireComplete && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <p className="text-green-800 text-sm font-medium">
                  {isGeneratingReport ? '問診票を生成中...' : '問診票が完成しました！'}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isQuestionnaireComplete || showQuestionnaireReview}
                placeholder={isListening ? "音声を認識中..." : "自然にお話しください..."}
                className={`w-full bg-white border border-gray-300 rounded-md px-5 py-4 pr-16 text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] max-h-[120px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent text-base ${
                  isListening ? 'ring-2 ring-red-500 border-red-500' : ''
                }`}
                rows={1}
              />
              
              {/* Voice input button */}
              {isVoiceSupported && (
                <button
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  disabled={isQuestionnaireComplete || showQuestionnaireReview}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
              
              <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                {isVoiceSupported ? 'Enter で送信 • マイクで音声入力' : 'Enter で送信'}
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isQuestionnaireComplete || showQuestionnaireReview}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md p-4 text-white transition-colors"
            >
              <Send size={22} />
            </button>
          </div>
          
          {/* Voice recognition status */}
          {isListening && (
            <div className="mt-3 flex items-center justify-center gap-2 text-red-600 animate-pulse">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm font-medium">音声を聞いています...</span>
            </div>
          )}
          

        </div>
      </div>
    </div>
  );
};

export default VRMChatApp;