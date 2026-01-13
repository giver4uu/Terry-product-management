import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building } from 'lucide-react';
import { UserRole, AlertPermissions } from '@/types/schema';

interface PermissionControlProps {
  userRole: UserRole;
  onPermissionChange?: (userId: string, permissions: AlertPermissions) => void;
}

export function PermissionControl({ userRole, onPermissionChange }: PermissionControlProps) {
  const getAuthorityLevelColor = (level: string) => {
    switch (level) {
      case 'vp': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'hr': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAuthorityIcon = (level: string) => {
    switch (level) {
      case 'vp': return <Shield className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      case 'hr': return <Building className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const togglePermission = (category: 'autoSend' | 'escalation', level: string) => {
    const newPermissions = { ...userRole.alertPermissions };
    
    if (category === 'autoSend') {
      const currentValue = newPermissions.autoSend[level as keyof typeof newPermissions.autoSend];
      newPermissions.autoSend = {
        ...newPermissions.autoSend,
        [level]: !currentValue
      };
    } else {
      const currentValue = newPermissions.escalation[level as keyof typeof newPermissions.escalation];
      newPermissions.escalation = {
        ...newPermissions.escalation,
        [level]: !currentValue
      };
    }
    
    onPermissionChange?.(userRole.id, newPermissions);
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'direct': return 'bg-red-100 text-red-800';
      case 'gentle': return 'bg-blue-100 text-blue-800';
      case 'informative': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const setTone = (tone: 'direct' | 'gentle' | 'informative') => {
    const newPermissions = {
      ...userRole.alertPermissions,
      tone
    };
    onPermissionChange?.(userRole.id, newPermissions);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getAuthorityIcon(userRole.authorityLevel)}
            {userRole.name} ({userRole.authorityLevel.toUpperCase()})
            <Badge className={getAuthorityLevelColor(userRole.authorityLevel)}>
              권한 레벨
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">자동 알림 발송 권한</h3>
            <div className="grid grid-cols-3 gap-4">
              {(['employee', 'manager', 'vp'] as const[]).map((level) => (
                <div key={level} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getAuthorityIcon(level)}
                    <span className="font-medium capitalize">{level.toUpperCase()}</span>
                    <div className="ml-auto">
                      <Button
                        variant={userRole.alertPermissions.autoSend[level as keyof typeof userRole.alertPermissions.autoSend] ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePermission('autoSend', level)}
                        className="w-20"
                      >
                        {userRole.alertPermissions.autoSend[level as keyof typeof userRole.alertPermissions.autoSend] ? '허용' : '차단'}
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {level === 'vp' && 'VP급 이상은 자동 발송 권한 안됨'}
                    {level === 'manager' && '매니저급은 HR 승인 필요'}
                    {level === 'employee' && '일반 직원은 자동 발송 가능'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">에스컬레이션 규칙</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">HR 승인 필요</div>
                  <div className="text-sm text-gray-600">자동 알림 발송 전 HR 승인</div>
                </div>
                <Button
                  variant={userRole.alertPermissions.escalation.hrApproval ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePermission('escalation', 'hrApproval')}
                >
                  {userRole.alertPermissions.escalation.hrApproval ? '활성화' : '비활성화'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">직접 발송만</div>
                  <div className="text-sm text-gray-600">HR만 직접 발송 가능</div>
                </div>
                <Button
                  variant={userRole.alertPermissions.escalation.directOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePermission('escalation', 'directOnly')}
                >
                  {userRole.alertPermissions.escalation.directOnly ? '활성화' : '비활성화'}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">알림 톤 설정</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['direct', 'gentle', 'informative'] as const[]).map((tone) => (
                <Button
                  key={tone}
                  variant={userRole.alertPermissions.tone === tone ? "default" : "outline"}
                  onClick={() => setTone(tone)}
                  className={`w-full ${getToneColor(tone)}`}
                >
                  {tone === 'direct' && '직접적 📢'}
                  {tone === 'gentle' && '정중한 💬'}
                  {tone === 'informative' && '정보 제공 ℹ️'}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">부서 접근 권한</h3>
            <div className="flex flex-wrap gap-2">
              {userRole.departmentAccess.map((dept) => (
                <Badge key={dept} variant="secondary">
                  {dept}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <strong>조직 정치 고려사항:</strong>
            <ul className="mt-1 space-y-1 text-gray-700">
              <li>• VP/임원에게 자동 알림은 조직 정치적으로 민감함</li>
              <li>• "HR이 먼저 검토 후 발송" 워크플로우 권장</li>
              <li>• 권한 레벨별로 그룹화하여 알림 발송 정책</li>
              <li>• 알림 톤을 직접적(📢)에서 정중한(💬)으로 조정</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}