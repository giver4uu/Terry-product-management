# 데이터 택소노미 설계

> Round HR Amplitude 이벤트 추적을 위한 택소노미 설계 문서.
> 13개 핵심 가설 검증에 필요한 이벤트, 사용자 프로퍼티, 퍼널을 정의한다.

## 현재 상태 (As-Is)

### 기술 인프라
| 구분 | 현황 | 상태 |
|------|------|------|
| 백엔드 Amplitude | `amplitude-api` gem, API key 설정됨 | 설치됨, 미활용 |
| 프론트엔드 Amplitude | `@round/analytics` 패키지, `logAnalyticsEvent()` | 설치됨, 기본만 사용 |
| Wisper 이벤트 버스 | 92+ 구독자 (Sync + Async) | 활발히 사용 중 |
| 사용자 프로퍼티 | email, name, plan, stage, created_at | 5개만 추적 |

### 문제점
- 제품 행동 이벤트가 Amplitude에 전송되지 않음
- Wisper 이벤트는 내부 로직(알림, 히스토리, 자동화)에만 사용
- 사용자 프로퍼티가 기본 식별 정보만 포함 (사용 행동 정보 없음)
- 퍼널 분석, 코호트 분석, A/B 테스트 불가

---

## 1. 이벤트 네이밍 컨벤션

### 형식
```
[Object]_[Action](_[Context])
```

### 규칙
| 규칙 | 설명 | 예시 |
|------|------|------|
| 케이스 | snake_case | `candidate_stage_moved` |
| 길이 | 최대 3-4 단어 | `integration_sync_completed` |
| Object | 대상 도메인 엔티티 | candidate, job, interview, feedback, ai, user, plan, integration, team, chat |
| Action | 과거형 동사 | created, viewed, completed, moved, submitted, synced, invited, upgraded |
| Context | (선택) 추가 맥락 | from_template, automatically |

### Object 카탈로그
| Object | 설명 | 관련 Wisper 스코프 |
|--------|------|-------------------|
| `candidate` | 후보자 및 지원자 관련 | `:Candidate`, `:CandidateStageHistory` |
| `job` | 채용 공고 관련 | `:Job`, `:JobStage` |
| `interview` | 면접 일정 관련 | `:Interview`, `:InterviewSchedule` |
| `feedback` | 평가 및 피드백 관련 | `:FeedbackMemberScore`, `:FeedbackCandidateScore` |
| `ai` | AI 기능 사용 관련 | 프론트엔드 전용 |
| `user` | 사용자 행동 관련 | `:User`, 프론트엔드 |
| `plan` | 요금제/결제 관련 | `:BillingPayment` |
| `integration` | 외부 플랫폼 연동 관련 | `:Integration`, `:Connect` |
| `team` | 팀/계정 단위 행동 | `:OrganizationMember` |
| `chat` | 채팅/메시지 관련 | `:CandidateChat`, `:CandidateMessage` |
| `form` | 양식/레퍼런스체크 관련 | `:FormRequest`, `:FormSubmission*` |

---

## 2. 핵심 이벤트 카탈로그

### Phase 0 - Foundation (Week 1-2): 10개

> P0 가설(H-A01, H-A02, H-E01, H-R01, H-ACC01, H-CH01) 검증을 위한 핵심 이벤트.
> 코호트 분석의 기초 데이터를 수집한다.

#### 백엔드 이벤트 (Wisper 구독자 활용) - 6개

| # | 이벤트명 | 설명 | 프로퍼티 | Wisper 스코프 | 관련 가설 |
|---|---------|------|---------|-------------|----------|
| 1 | `candidate_created` | 후보자/지원자 생성 | `source` (manual/import/integration), `job_id`, `platform` (wanted/saramin/etc) | `:Candidate` | H-A01, H-E01, H-E05, H-CH01, H-LI01 |
| 2 | `candidate_stage_moved` | 후보자 스테이지 이동 | `from_stage`, `to_stage`, `job_id`, `days_in_stage`, `moved_by` (user/automation) | `:CandidateStageHistory` | H-E01, H-R03 |
| 3 | `job_created` | 채용 공고 생성 | `used_template` (boolean), `job_type`, `stage_count` | `:Job` | H-A02, H-R03 |
| 4 | `job_published` | 채용 공고 게시 | `job_id`, `platforms_published` (array), `is_first_publish` (boolean) | `:Job` | H-A02 |
| 5 | `integration_sync_completed` | 플랫폼 연동 동기화 완료 | `platform`, `candidates_synced` (count), `is_first_sync` (boolean) | `:Integration` | H-A01, H-E05 |
| 6 | `team_member_invited` | 팀원 초대 | `role` (recruiter/interviewer/admin), `invitation_method`, `current_team_size` | `:OrganizationMember` | H-ACC01 |

#### 프론트엔드 이벤트 (`logAnalyticsEvent()` 활용) - 4개

| # | 이벤트명 | 설명 | 프로퍼티 | 관련 가설 |
|---|---------|------|---------|----------|
| 7 | `user_login` | 사용자 로그인 | `source` (direct/email/sso), `device_type` (desktop/mobile), `days_since_last_login` | H-R01, H-ACC01, H-CH01 |
| 8 | `session_started` | 세션 시작 | `referrer`, `landing_page`, `session_count` (n번째 세션) | H-R01 |
| 9 | `feature_first_use` | 기능 첫 사용 | `feature_name`, `days_since_signup` | H-R03 |
| 10 | `feedback_score_submitted` | 평가 점수 제출 | `overall_score`, `feedback_type`, `response_time_hours` | H-E01, H-E03, H-R03 |

#### Phase 0 이벤트-가설 매핑

```
H-A01 (플랫폼 연동)  ← integration_sync_completed, candidate_created(source=integration)
H-A02 (첫 공고 발행)  ← job_created, job_published
H-E01 (주간 처리량)   ← candidate_created + candidate_stage_moved + feedback_score_submitted (주간 합산)
H-R01 (로그인 빈도)   ← user_login, session_started
H-ACC01 (팀 활성)    ← team_member_invited, user_login (계정별 고유 사용자 수)
H-CH01 (이탈 신호)   ← candidate_created 부재 (14일간 0건), user_login 부재
```

---

### Phase 1 - Depth (Week 3-6): 12개 추가

> P1 가설(H-E03, H-E05, H-R03, H-REV01, H-LI01) 심화 추적 + P0 보완 이벤트.

#### 협업 관련 - 3개 (H-E03)

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 | 관련 가설 |
|---|---------|------|---------|------|----------|
| 11 | `mention_created` | @멘션 생성 | `context` (feedback/comment/task), `mentioned_role` | BE | H-E03, H-ACC01 |
| 12 | `comment_added` | 코멘트 추가 | `entity_type` (candidate/job), `is_reply` (boolean) | BE | H-E03, H-ACC01 |
| 13 | `feedback_requested` | 평가 요청 발송 | `requester_role`, `responder_role`, `job_id` | BE | H-E03 |

#### 매출 관련 - 4개 (H-REV01)

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 | 관련 가설 |
|---|---------|------|---------|------|----------|
| 14 | `plan_limit_approached` | 요금제 한도 80% 도달 | `limit_type` (seats/candidates), `current_usage`, `limit_value` | BE | H-REV01 |
| 15 | `plan_limit_reached` | 요금제 한도 100% 도달 | `limit_type`, `current_usage`, `limit_value` | BE | H-REV01 |
| 16 | `upgrade_prompt_shown` | 업그레이드 프롬프트 노출 | `trigger_reason`, `current_plan`, `suggested_plan` | FE | H-REV01 |
| 17 | `plan_upgraded` | 요금제 업그레이드 완료 | `from_plan`, `to_plan`, `trigger`, `monthly_or_annual` | BE | H-REV01, H-REV04 |

#### 기능 깊이 관련 - 3개 (H-R03, H-LI01)

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 | 관련 가설 |
|---|---------|------|---------|------|----------|
| 18 | `chat_message_sent` | 후보자 메시지 발송 | `channel` (email/sms/kakao), `is_bulk` (boolean), `is_scheduled` (boolean) | BE | H-R03 |
| 19 | `auto_action_triggered` | 자동화 룰 실행됨 | `action_type`, `trigger_condition`, `candidates_affected` | BE | H-R03 |
| 20 | `interview_scheduled` | 면접 일정 생성 | `method` (manual/calendar_sync), `type` (phone/video/onsite), `participants_count` | BE | H-E01, H-R03 |

#### AI 기본 추적 - 2개 (H-AI01)

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 | 관련 가설 |
|---|---------|------|---------|------|----------|
| 21 | `ai_screening_executed` | AI 스크리닝 실행 | `candidate_count`, `job_id`, `is_first_use` (boolean) | FE | H-AI01 |
| 22 | `ai_recommendation_accepted` | AI 추천 수용 | `recommendation_type`, `confidence_score`, `job_id` | FE | H-AI01 |

#### Phase 1 이벤트-가설 매핑

```
H-E03 (팀 협업)     ← mention_created + comment_added + feedback_requested (주간 합산)
H-E05 (멀티 플랫폼)  ← integration_sync_completed (계정별 고유 platform 수)
H-R03 (Feature 폭)  ← feature_first_use 누적 + chat/auto_action/interview 사용 여부
H-REV01 (업그레이드) ← plan_limit_approached → plan_limit_reached → plan_upgraded 퍼널
H-LI01 (Data Lock)  ← candidate_created 누적 수 (계정별)
H-AI01 (AI 관찰)    ← ai_screening_executed 1회+ 코호트 vs 미사용 코호트
```

---

### Phase 2 - Action (Week 7-10): 10개 추가

> P2 가설(H-R02, H-REV04, H-AI01 심화) 실행 + 성과 측정 이벤트.

#### 재참여 관련 - 2개 (H-R02)

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 |
|---|---------|------|---------|------|
| 23 | `re_engagement_sent` | 재참여 캠페인 발송 | `channel` (email/inapp), `campaign_type`, `days_inactive` | BE |
| 24 | `re_engagement_responded` | 재참여 캠페인 응답 (복귀) | `channel`, `campaign_type`, `days_to_return` | BE |

#### 연간 결제 관련 - 2개 (H-REV04)

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 |
|---|---------|------|---------|------|
| 25 | `annual_plan_offered` | 연간 결제 전환 제안 | `current_plan`, `months_retained`, `discount_offered` | FE |
| 26 | `annual_plan_converted` | 연간 결제 전환 완료 | `from_plan`, `months_retained`, `discount_applied` | BE |

#### 고객 성과 관련 - 4개

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 |
|---|---------|------|---------|------|
| 27 | `candidate_hired` | 후보자 채용 확정 | `job_id`, `days_to_hire`, `source`, `stages_passed` | BE |
| 28 | `report_generated` | 리포트 생성 | `report_type` (funnel/source/time), `date_range` | FE |
| 29 | `reference_check_completed` | 레퍼런스 체크 완료 | `referees_count`, `completion_time_days` | BE |
| 30 | `application_site_published` | 채용 사이트 게시 | `pages_count`, `jobs_listed` | BE |

#### AI 심화 관련 - 2개 (H-AI01 심화)

| # | 이벤트명 | 설명 | 프로퍼티 | 소스 |
|---|---------|------|---------|------|
| 31 | `ai_recommendation_overridden` | AI 추천 거부/수정 | `recommendation_type`, `override_reason`, `job_id` | FE |
| 32 | `ai_explanation_viewed` | AI 판단 근거 조회 | `recommendation_type`, `candidate_id` | FE |

---

## 3. 사용자 프로퍼티 확장

### 현재 (5개)
| 프로퍼티 | 타입 | 설명 |
|---------|------|------|
| `email` | string | 사용자 이메일 |
| `name` | string | 사용자 이름 |
| `plan` | string | 현재 요금제 |
| `stage` | string | 고객 단계 |
| `created_at` | datetime | 가입일 |

### Phase 0 추가 (6개) — P0 가설 지원

| 프로퍼티 | 타입 | 설명 | 관련 가설 | 업데이트 시점 |
|---------|------|------|----------|-------------|
| `organization_name` | string | 조직명 | 전체 | 가입 시 |
| `company_size` | string | 회사 규모 (1-10/11-50/51-200/201-500/500+) | 전체 | 가입 시 |
| `team_size` | integer | 현재 팀원 수 | H-ACC01 | 팀원 추가/제거 시 |
| `active_team_members` | integer | 최근 7일 활성 팀원 수 | H-ACC01 | 일일 배치 계산 |
| `integration_count` | integer | 연동된 플랫폼 수 | H-A01, H-E05 | 연동 추가/제거 시 |
| `total_candidates` | integer | 누적 관리 후보자 수 | H-CH01, H-LI01 | 후보자 생성 시 |

### Phase 1 추가 (4개) — P1 가설 지원

| 프로퍼티 | 타입 | 설명 | 관련 가설 | 업데이트 시점 |
|---------|------|------|----------|-------------|
| `features_adopted` | array | 사용한 기능 목록 | H-R03 | `feature_first_use` 시 |
| `feature_breadth_score` | integer | 사용 기능 수 (0-11) | H-R03 | `feature_first_use` 시 |
| `weekly_collaboration_count` | integer | 주간 협업 이벤트 수 | H-E03 | 주간 배치 계산 |
| `days_since_last_login` | integer | 마지막 로그인 이후 일수 | H-R02, H-CH01 | 로그인 시 리셋, 일일 증가 |

### Phase 2 추가 (3개) — P2 가설 + 운영 지원

| 프로퍼티 | 타입 | 설명 | 관련 가설 | 업데이트 시점 |
|---------|------|------|----------|-------------|
| `health_score` | integer | 고객 건강 점수 (0-100) | 전체 | 일일 배치 계산 |
| `monthly_active_days` | integer | 월간 활성 일수 | H-R01 | 일일 집계 |
| `at_risk` | boolean | 이탈 위험 여부 | H-CH01, H-R02 | 일일 배치 계산 |

---

## 4. 핵심 퍼널 4개

### 퍼널 1: 온보딩 퍼널

> **목적**: 신규 고객이 핵심 가치를 체험하기까지의 여정 분석. Aha Moment를 데이터로 발견한다.
> **관련 가설**: H-A01, H-A02, H-CH01

```
signup                          ← 가입
  ↓
job_created                     ← 첫 공고 생성
  ↓
job_published                   ← 첫 공고 게시        ★ H-A02 핵심 전환점
  ↓
integration_sync_completed      ← 플랫폼 연동         ★ H-A01 핵심 전환점
  ↓
candidate_created               ← 첫 후보자 등록
(source = integration)
  ↓
candidate_stage_moved           ← 첫 스테이지 이동
  ↓
team_member_invited             ← 팀원 초대
```

**핵심 지표**:
- 단계별 전환율 및 이탈 지점
- 7일 내 각 단계 도달률 (코호트별)
- 각 단계 완료 여부 × 30일/90일 리텐션 상관관계 → **Aha Moment 후보 도출**
- 14일 내 candidate_created = 0인 비율 → **H-CH01 이탈 위험 세그먼트**

---

### 퍼널 2: 주간 워크플로우 퍼널

> **목적**: 채용 담당자의 주간 업무 사용 깊이와 팀 협업 수준 분석
> **관련 가설**: H-E01, H-E03

```
user_login                      ← 주간 로그인 (3회+?)
  ↓
candidate_created               ← 후보자 등록/가져오기
  ↓
candidate_stage_moved           ← 서류 심사/단계 이동
  ↓
feedback_requested              ← 평가 요청 (팀 협업)
  ↓
feedback_score_submitted        ← 평가 완료
  ↓
interview_scheduled             ← 면접 일정 확정
```

**핵심 지표**:
- 주간 후보자 처리량 분포 (10명 기준 코호트 분리) → **H-E01**
- 주간 협업 이벤트 발생 여부 → **H-E03**
- 퍼널 전체 사용 vs 부분 사용 고객의 리텐션 차이
- 팀원 참여 여부(feedback_requested 발생)에 따른 이탈률 차이

---

### 퍼널 3: Account 활성화 퍼널

> **목적**: 계정 단위의 팀 정착 수준과 데이터 축적 효과 분석
> **관련 가설**: H-ACC01, H-LI01, H-E05

```
team_member_invited             ← 첫 팀원 초대
  ↓
2nd user_login                  ← 두 번째 팀원 로그인
(same account, different user)
  ↓
mention_created                 ← 팀 간 @멘션 시작
  OR
comment_added                   ← 팀 간 코멘트 시작
  ↓
3+ active_team_members          ← 주간 활성 3명+ 도달  ★ H-ACC01 임계점
  ↓
integration_sync_completed      ← 2개+ 플랫폼 연동
(2nd platform)
  ↓
total_candidates > 500          ← 누적 데이터 500명+   ★ H-LI01 Lock-in 지점
```

**핵심 지표**:
- 팀원 초대 → 실제 로그인 전환율
- 활성 팀원 수별(1명/2명/3명+) 연간 유지율 → **H-ACC01**
- 연동 플랫폼 수별(1개/2개/3개+) 처리량 및 이탈률 → **H-E05**
- 누적 후보자 수 구간별 이탈률 → **H-LI01**

---

### 퍼널 4: 업그레이드 퍼널

> **목적**: Starter → Growth 전환 여정 분석. 한도 도달 타이밍과 업그레이드 패턴 파악.
> **관련 가설**: H-REV01, H-REV04

```
plan_limit_approached           ← 한도 80% 도달 (인식)
  ↓
plan_limit_reached              ← 한도 100% 도달 (압박)
  ↓
upgrade_prompt_shown            ← 업그레이드 제안 노출
  ↓
plan_upgraded                   ← 업그레이드 완료
(monthly_or_annual = "monthly")
  ↓ (6개월+ 유지 후)
annual_plan_offered             ← 연간 전환 제안
  ↓
annual_plan_converted           ← 연간 전환 완료       ★ H-REV04
```

**핵심 지표**:
- 한도 도달 → 업그레이드 전환율 및 평균 소요 일수 → **H-REV01**
- 한도 유형별(seats vs candidates) 전환율 차이
- 가입 → 한도 도달까지 평균 기간 (3-4개월 가설 검증)
- 6개월+ 유지 고객의 연간 전환 수용률 → **H-REV04**

---

## 5. 이벤트-가설 매핑 매트릭스

| 이벤트 | H-A01 | H-A02 | H-E01 | H-E03 | H-E05 | H-R01 | H-R03 | H-ACC01 | H-CH01 | H-LI01 | H-REV01 | H-REV04 | H-AI01 |
|--------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-------:|:------:|:------:|:-------:|:-------:|:------:|
| `candidate_created` | ● | | ● | | ● | | ● | | ● | ● | | | |
| `candidate_stage_moved` | | | ● | | | | ● | | | | | | |
| `job_created` | | ● | | | | | ● | | | | | | |
| `job_published` | | ● | | | | | | | | | | | |
| `integration_sync_completed` | ● | | | | ● | | ● | | | | | | |
| `team_member_invited` | | | | | | | | ● | | | | | |
| `user_login` | | | | | | ● | | ● | ● | | | | |
| `session_started` | | | | | | ● | | | | | | | |
| `feature_first_use` | | | | | | | ● | | | | | | |
| `feedback_score_submitted` | | | ● | ● | | | ● | | | | | | |
| `mention_created` | | | | ● | | | | ● | | | | | |
| `comment_added` | | | | ● | | | | ● | | | | | |
| `feedback_requested` | | | | ● | | | | | | | | | |
| `plan_limit_reached` | | | | | | | | | | | ● | | |
| `plan_upgraded` | | | | | | | | | | | ● | ● | |
| `ai_screening_executed` | | | | | | | | | | | | | ● |

---

## 6. 기술 구현 가이드

### 백엔드: AmplitudeTrackingSubscriber 구조

```
round-server/
├── app/subscribers/
│   └── amplitude_tracking_subscriber.rb    ← 신규 생성
├── config/initializers/
│   ├── amplitude.rb                        ← 기존 (변경 최소)
│   └── wisper.rb                           ← 구독자 등록 추가
```

**구독자 등록 방식** (wisper.rb에 추가):
```ruby
# Amplitude 이벤트 추적 구독자 - Phase 0
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :Candidate)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :CandidateStageHistory)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :Job)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :Integration)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :OrganizationMember)

# Phase 1 추가
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :FeedbackMemberScore)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :InterviewSchedule)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :CandidateChat)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :CandidateAutoAction)
Wisper.subscribe(AmplitudeTrackingSubscriber.new, scope: :BillingPayment)
```

### 프론트엔드: 이벤트 함수 구조

```
when-front/packages/round/analytics/src/
├── analytics.ts                ← 기존 (setAnalyticsUser 수정)
└── events/                     ← 신규 디렉토리
    ├── index.ts                ← 이벤트 함수 re-export
    ├── user-events.ts          ← user_login, session_started
    ├── feature-events.ts       ← feature_first_use
    ├── ai-events.ts            ← ai_screening_executed, ai_recommendation_*
    └── plan-events.ts          ← upgrade_prompt_shown, annual_plan_offered
```

**이벤트 함수 패턴**:
```typescript
// user-events.ts
import { logAnalyticsEvent } from '../analytics'

export const trackUserLogin = (params: {
  source: 'direct' | 'email' | 'sso'
  deviceType: 'desktop' | 'mobile'
  daysSinceLastLogin: number
}) => {
  logAnalyticsEvent('user_login', {
    source: params.source,
    device_type: params.deviceType,
    days_since_last_login: params.daysSinceLastLogin,
  })
}
```

---

## 변경 이력

| 날짜 | 변경 | 상세 |
|------|------|------|
| 2026-02-13 | 초기 작성 | 45개 이벤트, 25개 가설 기준 |
| 2026-02-13 | 가설 연동 수정 | 13개 핵심 가설 기준으로 재구성. 이벤트 45개→32개, 퍼널 AI 채택→Account 활성화 교체 |

*Phase 0 이벤트 수: 10개 | Phase 1 누적: 22개 | Phase 2 누적: 32개*
