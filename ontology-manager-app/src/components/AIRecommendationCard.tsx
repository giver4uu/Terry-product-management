import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { AIRecommendation, AIAction, OverrideOption } from '@/types/schema';

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onAction?: (actionId: string) => void;
  onOverride?: (recommendationId: string, overrideType: string, reason?: string) => void;
  onDismiss?: (recommendationId: string) => void;
}

export function AIRecommendationCard({ recommendation, onAction, onOverride, onDismiss }: AIRecommendationCardProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bottleneck': return <AlertTriangle className="h-4 w-4" />;
      case 'next_action': return <Clock className="h-4 w-4" />;
      case 'reapplicant_context': return <CheckCircle className="h-4 w-4" />;
      case 'ghosting_risk': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDataQualityColor = (trustLevel: string) => {
    switch (trustLevel) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getTypeIcon(recommendation.type)}
            {recommendation.type.replace('_', ' ').toUpperCase()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getConfidenceColor(recommendation.confidence)}>
              확신도 {formatConfidence(recommendation.confidence)}
            </Badge>
            <Badge className={getDataQualityColor(recommendation.dataQuality.trustLevel)}>
              데이터 품질 {recommendation.dataQuality.trustLevel.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium mb-2">AI 제안 근거:</h4>
          <ul className="space-y-1 text-sm">
            {recommendation.reasoning.map((reason: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {recommendation.dataQuality.trustLevel !== 'high' && (
          <div className={`p-3 rounded-lg border ${getDataQualityColor(recommendation.dataQuality.trustLevel)}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                {recommendation.dataQuality.gaps.length > 0 
                  ? `데이터 누락 ${recommendation.dataQuality.gaps.length}건으로 신뢰도 낮음`
                  : '데이터 품질이 낮아 예측 정확도에 영향을 줄 수 있음'
                }
              </span>
            </div>
            {recommendation.dataQuality.gaps.length > 0 && (
              <div className="mt-2 text-sm">
                <strong>누락 데이터:</strong> {recommendation.dataQuality.gaps.map((gap: any) => gap.missingFields.join(', ')).join(' / ')}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">권장 조치사항:</h4>
          <div className="space-y-2">
            {recommendation.suggestedActions.map((action: AIAction, index: number) => (
              <div key={action.id} className={`p-3 border rounded-lg ${getUrgencyColor(action.urgency)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{action.description}</div>
                    <div className="text-sm text-gray-600">
                      예상 소요시간: {action.estimatedTime ? `${action.estimatedTime}분` : 'N/A'}
                      {action.autoExecutable && ' • 자동 실행 가능'}
                    </div>
                  </div>
                  <Button
                    onClick={() => onAction?.(action.id)}
                    variant={action.urgency === 'high' ? 'default' : 'outline'}
                    size="sm"
                    className="ml-2"
                  >
                    실행
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            생성일: {new Date(recommendation.createdAt).toLocaleString('ko-KR')}
          </div>
          <div className="flex gap-2">
            {recommendation.overrideOptions.map((option: OverrideOption, index: number) => (
              <Button
                key={option.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (option.reasonRequired) {
                    const reason = prompt('오버라이드 사유를 입력해주세요:');
                    if (reason) {
                      onOverride?.(recommendation.id, option.type, reason);
                    }
                  } else {
                    onOverride?.(recommendation.id, option.type);
                  }
                }}
              >
                <X className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss?.(recommendation.id)}
            >
              닫기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}