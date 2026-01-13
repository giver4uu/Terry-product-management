import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataQualityMetrics, DataGap } from '@/types/schema';

interface DataQualityDashboardProps {
  metrics: DataQualityMetrics;
  onFixDataGap?: (gap: DataGap) => void;
}

export function DataQualityDashboard({ metrics, onFixDataGap }: DataQualityDashboardProps) {
  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrustLevelIcon = (level: string) => {
    switch (level) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '🔴';
      default: return '⚪';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            데이터 품질 대시보드
            <Badge className={getTrustLevelColor(metrics.trustLevel)}>
              {getTrustLevelIcon(metrics.trustLevel)} {metrics.trustLevel.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">완성도</span>
                <span className="text-sm text-gray-600">{metrics.completeness}%</span>
              </div>
              <Progress value={metrics.completeness} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">일관성</span>
                <span className="text-sm text-gray-600">{metrics.consistency}%</span>
              </div>
              <Progress value={metrics.consistency} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">최신성</span>
                <span className="text-sm text-gray-600">{metrics.timeliness}%</span>
              </div>
              <Progress value={metrics.timeliness} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">최종 업데이트</span>
                <span className="text-sm text-gray-600">
                  {new Date(metrics.lastUpdated).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {metrics.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">데이터 누락 ({metrics.gaps.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.gaps.map((gap, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{gap.classId}</div>
                        <div className="text-sm">
                          누락 필드: {gap.missingFields.join(', ')}
                        </div>
                        <div className="text-sm">
                          영향받은 레코드: {gap.affectedCount}건
                        </div>
                        {gap.description && (
                          <div className="text-sm mt-1">{gap.description}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge variant={getPriorityColor(gap.priority)}>
                          {gap.priority.toUpperCase()}
                        </Badge>
                        {onFixDataGap && (
                          <button
                            onClick={() => onFixDataGap(gap)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            지금 업데이트
                          </button>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {metrics.trustLevel !== 'high' && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>
                현재 데이터 품질이 {metrics.completeness < 70 ? '70% 미만으로' : '기준 미달'} 
                AI 인사이트 신뢰도가 낮을 수 있습니다. 
                데이터 누락을 보완하여 품질을 개선하세요.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}