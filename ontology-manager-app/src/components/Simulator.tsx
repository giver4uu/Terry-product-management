import { useState } from 'react';
import { useOntologyStore } from '../stores/useOntologyStore';
import { useTranslation } from 'react-i18next';
import { X, Play, CheckCircle, XCircle, AlertTriangle, Database, MessageSquare, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';

// Enhanced Query Patterns based on Use Case Catalog v2.0
const QUERY_PATTERNS = [
    {
        id: 'UC-007',
        name: '프로세스 병목 진단',
        keywords: ['bottleneck', 'delay', 'stage', 'process', 'slow', '병목', '지연', '단계', '프로세스', '오래', 'why', '왜'],
        requiredNodes: ['Application', 'Recruitment Stage', 'Stage Transition'],
        requiredProperties: ['current_stage', 'timestamp', 'benchmark'],
        requiredEdges: ['PROGRESSES_TO'],
        description: 'Process Bottleneck Diagnosis',
        cypher: `MATCH (a:Application)-[:PROGRESSES_TO]->(s:Recruitment_Stage)
WITH s, avg(a.stage_duration) as avg_time
WHERE avg_time > s.benchmark
RETURN s.name AS bottleneck_stage,
       avg_time AS avg_days,
       s.benchmark AS target_days,
       avg_time - s.benchmark AS delay_days
ORDER BY delay_days DESC`,
        exampleQuestions: [
            '채용 프로세스에서 병목이 어디야?',
            'Why is hiring taking so long?',
            '어느 단계에서 지연되는지 알려줘'
        ]
    },
    {
        id: 'UC-011',
        name: '다음 액션 리마인더',
        keywords: ['reminder', 'follow up', 'action', 'schedule', 'todo', '리마인더', '팔로업', '할일', '일정', 'task', '해야할', '잊어버', 'next'],
        requiredNodes: ['Application', 'Task', 'Recruiter', 'Communication'],
        requiredProperties: ['last_contact', 'due_date', 'assigned_recruiter'],
        requiredEdges: ['ASSIGNS', 'COMMUNICATES_WITH'],
        description: 'Next Action Reminder',
        cypher: `MATCH (r:Recruiter)-[:ASSIGNS]->(a:Application)
OPTIONAL MATCH (r)-[:COMMUNICATES_WITH]->(c:Candidate)
WHERE date(a.last_contact) < date() - duration('P5D')
RETURN r.name AS recruiter,
       a.candidate_name AS candidate,
       a.last_contact AS last_contacted,
       "Follow-up Required" AS action_type
ORDER BY a.last_contact ASC
LIMIT 10`,
        exampleQuestions: [
            '오늘 해야 할 일이 뭐야?',
            'Who do I need to follow up with?',
            '연락 안 한 후보자 알려줘'
        ]
    },
    {
        id: 'UC-003',
        name: '재지원자 맥락 제공',
        keywords: ['re-applicant', 'history', 'previous', 'again', 'duplicate', '재지원', '이력', '과거', '중복', 'applicant', 'before', '전에', '또'],
        requiredNodes: ['Candidate', 'Application'],
        requiredProperties: ['email', 'applied_date', 'current_stage'],
        requiredEdges: ['CREATES'],
        description: 'Re-applicant Context Provider',
        cypher: `MATCH (c:Candidate)<-[:CREATES]-(a:Application)
WITH c, collect(a) AS applications
WHERE size(applications) > 1
UNWIND applications AS app
RETURN c.name AS candidate,
       c.email AS email,
       app.applied_date AS applied,
       app.final_status AS outcome,
       app.rejection_reason AS reason
ORDER BY app.applied_date DESC`,
        exampleQuestions: [
            '이 사람 전에도 지원했나?',
            'Has this candidate applied before?',
            '재지원자 목록 보여줘'
        ]
    },
    {
        id: 'UC-008',
        name: '면접관 피드백 지연 알림',
        keywords: ['feedback', 'late', 'interviewer', 'evaluation', 'submit', '피드백', '늦음', '면접관', '평가', 'missing', '안줘', '안옴'],
        requiredNodes: ['Interview', 'Evaluation', 'Interviewer'],
        requiredProperties: ['scheduled_date', 'score', 'feedback_text'],
        requiredEdges: ['EVALUATES', 'PARTICIPATES_IN'],
        description: 'Interviewer Feedback Delay Alert',
        cypher: `MATCH (i:Interview)-[:PARTICIPATES_IN]-(intr:Interviewer)
WHERE i.status = 'Completed'
  AND NOT EXISTS {
    MATCH (intr)-[:EVALUATES]->(e:Evaluation)
    WHERE e.interview_id = i.id
  }
  AND i.scheduled_date < datetime() - duration('P1D')
RETURN intr.name AS interviewer,
       i.scheduled_date AS interview_date,
       datetime() - i.scheduled_date AS overdue_hours,
       "Feedback Missing" AS alert_type`,
        exampleQuestions: [
            '피드백 안 준 면접관 누구야?',
            'Who hasn\'t submitted their feedback?',
            '면접 평가 지연된 거 있어?'
        ]
    },
    {
        id: 'UC-023',
        name: 'AI 학습 피드백 루프',
        keywords: ['learn', 'feedback', 'accuracy', 'improve', 'ai', '학습', '정확도', '개선', 'recommendation', '추천', '맞았', 'correct'],
        requiredNodes: ['AI Recommendation', 'Application', 'Evaluation'],
        requiredProperties: ['confidence_score', 'type', 'score'],
        requiredEdges: ['RECOMMENDS_FOR', 'VALIDATED_BY'],
        description: 'AI Learning Feedback Loop',
        cypher: `MATCH (ai:AI_Recommendation)-[:RECOMMENDS_FOR]->(a:Application)
OPTIONAL MATCH (ai)-[:VALIDATED_BY]->(e:Evaluation)
RETURN ai.type AS recommendation_type,
       avg(ai.confidence_score) AS avg_confidence,
       count(CASE WHEN e IS NOT NULL THEN 1 END) AS validated_count,
       count(ai) AS total_count`,
        exampleQuestions: [
            'AI 추천 정확도가 어때?',
            'How well is the AI learning?',
            'AI가 잘 맞추고 있어?'
        ]
    },
    {
        id: 'UC-025',
        name: '후보자 연락 블랙홀 알림',
        keywords: ['ghosting', 'no response', 'silent', 'ghost', '잠수', '응답없', '연락두절', '노쇼', 'contact', 'disappeared'],
        requiredNodes: ['Candidate', 'Communication'],
        requiredProperties: ['avg_response_time', 'response_pattern', 'channel'],
        requiredEdges: ['COMMUNICATES_WITH'],
        description: 'Candidate Ghosting Alert',
        cypher: `MATCH (c:Candidate)<-[:COMMUNICATES_WITH]-(comm:Communication)
WITH c, max(comm.timestamp) AS last_contact, c.avg_response_time AS avg_response
WHERE datetime() - last_contact > avg_response * 3
RETURN c.name AS candidate,
       c.email AS email,
       last_contact AS last_contacted,
       avg_response AS typical_response_hours,
       "Ghosting Risk" AS alert_type`,
        exampleQuestions: [
            '연락 안 되는 후보자 있어?',
            'Who might be ghosting us?',
            '응답 없는 후보자 찾아줘'
        ]
    }
];

// Example questions for quick test
const EXAMPLE_QUESTIONS = [
    { text: '채용 프로세스에서 병목이 어디야?', useCase: 'UC-007' },
    { text: '오늘 해야 할 팔로업 알려줘', useCase: 'UC-011' },
    { text: '이 후보자 전에 지원한 적 있어?', useCase: 'UC-003' },
    { text: '피드백 안 준 면접관 누구야?', useCase: 'UC-008' },
    { text: '연락 안 되는 후보자 있어?', useCase: 'UC-025' }
];

export const Simulator = ({ onClose }: { onClose: () => void }) => {
    const { t } = useTranslation();
    const { nodes, edges } = useOntologyStore();
    const [question, setQuestion] = useState('');
    const [result, setResult] = useState<any>(null);

    const analyzeQuestion = () => {
        const lowerQ = question.toLowerCase();
        const existingLabels = new Set(nodes.map(n => n.data.label));
        const existingProperties = new Set(
            nodes.flatMap(n => n.data.properties.map(p => p.name))
        );
        const existingEdgeLabels = new Set(edges.map(e => e.data?.label || ''));

        // 1. Find matching Use Case Pattern
        let matchedPattern = QUERY_PATTERNS.find(p =>
            p.keywords.some(k => lowerQ.includes(k.toLowerCase()))
        );

        if (!matchedPattern) {
            setResult({
                status: 'fail',
                feedbackMsg: '질문을 이해하지 못했습니다. 다른 표현으로 시도해보세요.',
                errorDetails: null,
                matchedPattern: null,
                generatedQuery: '// 쿼리 생성 불가'
            });
            return;
        }

        // 2. Check Schema Support
        const missingNodes = matchedPattern.requiredNodes.filter(req =>
            !Array.from(existingLabels).some(l =>
                l.toLowerCase().includes(req.toLowerCase().split(' ')[0])
            )
        );

        const missingEdges = matchedPattern.requiredEdges?.filter(req =>
            !Array.from(existingEdgeLabels).some(l => l.includes(req))
        ) || [];

        const missingProperties = matchedPattern.requiredProperties?.filter(req =>
            !Array.from(existingProperties).some(p => p.includes(req))
        ) || [];

        // 3. Determine Result Status
        let status: 'success' | 'partial' | 'fail';
        let feedbackMsg: string;
        let errorDetails: any = null;

        if (missingNodes.length === 0 && missingEdges.length === 0) {
            status = 'success';
            feedbackMsg = `✅ "${matchedPattern.name}" 쿼리 생성 가능!`;
        } else if (missingNodes.length > 0) {
            status = 'fail';
            feedbackMsg = `❌ 이 질문을 처리하려면 스키마에 누락된 클래스가 있습니다.`;
            errorDetails = {
                type: 'missing_nodes',
                title: '누락된 클래스 (Nodes)',
                items: missingNodes,
                suggestion: `다음 클래스를 스키마에 추가하세요: ${missingNodes.join(', ')}`
            };
        } else if (missingEdges.length > 0) {
            status = 'partial';
            feedbackMsg = `⚠️ 부분적 지원: 관계(Relationship)가 누락되었습니다.`;
            errorDetails = {
                type: 'missing_edges',
                title: '누락된 관계 (Relationships)',
                items: missingEdges,
                suggestion: `다음 관계를 추가하세요: ${missingEdges.join(', ')}`
            };
        } else {
            status = 'partial';
            feedbackMsg = `⚠️ 부분적 지원: 일부 프로퍼티가 누락되었습니다.`;
            errorDetails = {
                type: 'missing_properties',
                title: '권장 프로퍼티',
                items: missingProperties,
                suggestion: `더 정확한 결과를 위해 다음 프로퍼티 추가를 권장: ${missingProperties.join(', ')}`
            };
        }

        setResult({
            status,
            feedbackMsg,
            errorDetails,
            matchedPattern,
            generatedQuery: status !== 'fail' ? matchedPattern.cypher : '// 스키마가 이 쿼리를 지원하지 않습니다'
        });
    };

    const handleExampleClick = (q: string) => {
        setQuestion(q);
        setResult(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Play className="w-5 h-5 text-blue-600" />
                        Use Case Simulator
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 bg-white dark:bg-slate-900">
                    {/* Example Questions */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Lightbulb className="w-3.5 h-3.5" />
                            예시 질문 (클릭하여 테스트)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {EXAMPLE_QUESTIONS.map((eq, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleExampleClick(eq.text)}
                                    className="text-xs px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                >
                                    {eq.text}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t('simulator_question_label') || "자연어로 질문하세요:"}
                        </label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                placeholder={t('simulator_placeholder') || "예: 채용 프로세스에서 병목이 어디야?"}
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && analyzeQuestion()}
                            />
                            <button
                                onClick={analyzeQuestion}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Play className="w-4 h-4" />
                                {t('simulate') || "변환"}
                            </button>
                        </div>
                    </div>

                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Status Banner */}
                            <div className={cn(
                                "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                                result.status === 'success' ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" :
                                    result.status === 'partial' ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" :
                                        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            )}>
                                {result.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" /> :
                                    result.status === 'partial' ? <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" /> :
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />}

                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                                        {result.matchedPattern?.name || '알 수 없는 패턴'}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {result.feedbackMsg}
                                    </p>
                                </div>
                            </div>

                            {/* Error Details */}
                            {result.errorDetails && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                                        {result.errorDetails.title}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {result.errorDetails.items.map((item: string, idx: number) => (
                                            <span key={idx} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-mono">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span>{result.errorDetails.suggestion}</span>
                                    </p>
                                </div>
                            )}

                            {/* Generated Query */}
                            <div className="relative">
                                <div className="absolute top-0 right-0 p-2">
                                    <Database className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">생성된 Cypher 쿼리</div>
                                <pre className="bg-slate-900 text-slate-200 p-4 rounded-md text-xs font-mono overflow-x-auto border border-slate-700">
                                    <code>{result.generatedQuery}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

