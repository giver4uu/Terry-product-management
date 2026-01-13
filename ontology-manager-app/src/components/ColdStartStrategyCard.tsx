import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Database, Users, AlertCircle } from 'lucide-react';
import { ColdStartStrategy } from '@/types/schema';

interface ColdStartStrategyProps {
  strategy: ColdStartStrategy;
  onUseBenchmark?: () => void;
  onSimilarCaseView?: () => void;
}

export function ColdStartStrategyCard({ strategy, onUseBenchmark, onSimilarCaseView }: ColdStartStrategyProps) {
  const getDisplayModeColor = (mode: string) => {
    switch (mode) {
      case 'prediction': return 'bg-green-100 text-green-800';
      case 'similar_cases': return 'bg-blue-100 text-blue-800';
      case 'industry_average': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDataCountMessage = () => {
    if (strategy.dataCount === 0) {
      return '데이터가 없습니다. 벤치마크 데이터를 활용하여 AI 기능을 제공합니다.';
    }
    if (strategy.dataCount < 50) {
      return `현재 ${strategy.dataCount}건의 데이터가 있습니다. AI 정확도가 낮을 수 있습니다.`;
    }
    return `현재 ${strategy.dataCount}건의 데이터가 충분되어 있습니다.`;
  };

  const getRecommendationMessage = () => {
    switch (strategy.displayMode) {
      case 'prediction':
        return '예측 기반 AI 제안을 제공합니다.';
      case 'similar_cases':
        return '과거 유사 케이스를 기반으로 즉각 보기 쉬운 정보를 제공합니다.';
      case 'industry_average':
        return '업계 평균 데이터를 기반으로 초기 가이드를 제공합니다.';
      default:
        return '기본 정보를 제공합니다.';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            콜드 스타트 전략
            <Badge className={getTrustScoreColor(strategy.trustScore)}>
              신뢰도 {Math.round(strategy.trustScore * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                데이터 축적 가이드
              </span>
            </div>
            <div className="mt-3 text-sm text-blue-700">
              {getDataCountMessage()}
            </div>
            {strategy.dataCount > 0 && strategy.dataCount < 50 && (
              <div className="mt-2">
                <div className="font-medium text-blue-800">빠른 데이터 축적 제안:</div>
                <ul className="mt-1 space-y-1 text-sm text-blue-700">
                  <li>• 일일 3건 이상 데이터 입력 목표</li>
                  <li>• 주간 15건 이상 자동 수집 활성화</li>
                  <li>• 월간 50건 달성 시 정확도 배지 획득</li>
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">현재 표시 모드:</h4>
              <div className="flex items-center gap-2">
                <Badge className={getDisplayModeColor(strategy.displayMode)}>
                  {strategy.displayMode === 'prediction' && '예측 모드'}
                  {strategy.displayMode === 'similar_cases' && '유사 케이스 모드'}
                  {strategy.displayMode === 'industry_average' && '업계 평균 모드'}
                </Badge>
                <span className="text-sm text-gray-600">{getRecommendationMessage()}</span>
              </div>
            </div>

            {strategy.message && (
              <div className={`p-3 rounded-lg border ${getDisplayModeColor(strategy.displayMode)}`}>
                <div className="text-sm">{strategy.message}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={onSimilarCaseView}
                disabled={strategy.displayMode === 'similar_cases'}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                유사 케이스 보기
              </Button>
              
              {strategy.benchmarkAvailable && (
                <Button
                  variant="outline"
                  onClick={onUseBenchmark}
                  disabled={strategy.displayMode === 'industry_average'}
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-2" />
                  벤치마크 데이터 활용
                </Button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <strong>콜드 스타트 주의사항:</strong>
                <ul className="mt-1 space-y-1 text-gray-700">
                  <li>• 데이터 50건 미만: 예측보다 유사 케이스 추천</li>
                  <li>• 데이터 100건 미만: 외부 벤치마크 적극 활용</li>
                  <li>• 정확도 낮은 시기: "예측 불가" 대신 솔직한 정보 제공</li>
                  <li>• 고객 기대치 관리: 투명한 신뢰도 점수 표시</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {strategy.trustScore < 0.6 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">조기 개선 권장사항</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>데이터 품질 개선이 시급합니다.</strong>
                  현재 신뢰도가 60% 미만으로 AI 기능의 가치가 크게 제한됩니다.
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">즉시 실행할 조치:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 누락 데이터 보완 자동화</li>
                  <li>• 데이터 입력 간소화 (1클릭 업데이트)</li>
                  <li>• 외부 벤치마크 데이터 소싱</li>
                  <li>• 유사 케이스 기반 UI/UX 개선</li>
                </ul>
              </div>
              
              <Button variant="destructive" className="w-full">
                데이터 품질 개선 계획 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}