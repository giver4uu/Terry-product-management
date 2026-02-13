# 구현 로드맵

> 데이터 택소노미 구현을 위한 주차별 실행 계획.
> 13개 핵심 가설 검증에 필요한 32개 이벤트를 Phase별로 구현한다.

---

## 전체 타임라인

```
Week 1-2    Week 3-6      Week 7-10
┌─────────┐ ┌───────────┐ ┌────────────┐
│ Phase 0 │→│  Phase 1  │→│  Phase 2   │
│Foundation│ │   Depth   │ │   Action   │
│ 10 events│ │+12 events │ │ +10 events │
│ P0 가설  │ │ P1 가설   │ │ P2 가설    │
└─────────┘ └───────────┘ └────────────┘
```

---

## Phase 0: Foundation (Week 1-2)

### 목표
- 백엔드/프론트엔드 이벤트 추적 인프라 구축
- 10개 핵심 이벤트 구현 (P0 가설 검증용)
- Amplitude 기본 차트 + 퍼널 구성

### 검증 대상 가설
| 가설 | 분석 유형 |
|------|----------|
| H-A01 (플랫폼 연동 → 유지율 25%↑) | 성공 패턴 |
| H-A02 (첫 공고 발행 → 유지율 2배+) | 성공 패턴 |
| H-E01 (주간 처리 10명+ → 유지율 2배) | 성공 패턴 |
| H-R01 (주 3회 로그인 → 유지율 2.5배) | 성공 패턴 |
| H-ACC01 (팀 3명+ 활성 → 유지율 85%+) | 성공 패턴 |
| H-CH01 (14일 지원자 0명 → 이탈률 65%) | 실패 패턴 |

### Week 1: 백엔드 인프라 + 6개 이벤트

#### 태스크
| # | 태스크 | 예상 소요 | 담당 |
|---|-------|----------|------|
| 1 | `AmplitudeTrackingSubscriber` 클래스 생성 | 4h | BE |
| 2 | Wisper에 구독자 등록 (5개 스코프: Candidate, CandidateStageHistory, Job, Integration, OrganizationMember) | 1h | BE |
| 3 | `candidate_created` 이벤트 구현 | 2h | BE |
| 4 | `candidate_stage_moved` 이벤트 구현 | 2h | BE |
| 5 | `job_created` 이벤트 구현 | 1h | BE |
| 6 | `job_published` 이벤트 구현 | 1h | BE |
| 7 | `integration_sync_completed` 이벤트 구현 | 1h | BE |
| 8 | `team_member_invited` 이벤트 구현 | 1h | BE |
| 9 | 로컬 환경 Amplitude 디버거 테스트 | 2h | BE |

#### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `round-server/app/subscribers/amplitude_tracking_subscriber.rb` | **신규** - Wisper 이벤트를 Amplitude 이벤트로 변환하여 전송 |
| `round-server/config/initializers/wisper.rb` | 기존 92+ 구독자 목록에 AmplitudeTrackingSubscriber 등록 추가 |
| `round-server/config/initializers/amplitude.rb` | 변경 최소 - 필요 시 환경변수 분기 추가 |

### Week 2: 프론트엔드 인프라 + 4개 이벤트

#### 태스크
| # | 태스크 | 예상 소요 | 담당 |
|---|-------|----------|------|
| 10 | `events/` 디렉토리 구조 생성 | 1h | FE |
| 11 | `user_login` 이벤트 구현 (days_since_last_login 포함) | 2h | FE |
| 12 | `session_started` 이벤트 구현 | 2h | FE |
| 13 | `feature_first_use` 이벤트 구현 (11개 핵심 기능 정의) | 3h | FE |
| 14 | `feedback_score_submitted` 이벤트 구현 | 1h | FE |
| 15 | `setAnalyticsUser()` user properties 확장 (Phase 0: 6개) | 3h | FE |
| 16 | Amplitude 기본 차트 8개 구성 | 3h | PM |
| 17 | Amplitude 퍼널 4개 구성 | 2h | PM |
| 18 | E2E 이벤트 전송 검증 | 2h | FE+BE |

#### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `when-front/packages/round/analytics/src/events/` | **신규** 디렉토리 - 이벤트별 추적 함수 |
| `when-front/packages/round/analytics/src/events/index.ts` | **신규** - 이벤트 함수 re-export |
| `when-front/packages/round/analytics/src/events/user-events.ts` | **신규** - user_login, session_started |
| `when-front/packages/round/analytics/src/events/feature-events.ts` | **신규** - feature_first_use |
| `when-front/packages/round/analytics/src/analytics.ts` | `setAnalyticsUser()` user properties 확장 |

### Phase 0 완료 기준
- [ ] 10개 이벤트가 Amplitude Debugger에서 확인됨
- [ ] User properties 11개 (기존 5 + 신규 6) 정상 업데이트
- [ ] 기본 차트 8개 + 퍼널 4개 Amplitude에 구성됨
- [ ] 이벤트 프로퍼티 null율 < 5%
- [ ] P0 코호트 분석 시작 가능한 데이터 확보

---

## Phase 1: Depth (Week 3-6)

### 목표
- 12개 추가 이벤트 구현 (누적 22개)
- P0 코호트 분석 실행 및 Aha Moment 탐색
- P1 가설 검증 데이터 수집 시작

### 검증 대상 가설
| 가설 | 분석 유형 |
|------|----------|
| H-E03 (팀 협업 주 1회+ → 이탈률 40%↓) | 심화 분석 |
| H-E05 (3개+ 플랫폼 → 처리량 2배) | 심화 분석 |
| H-R03 (4개+ 기능 → 유지율 75%+) | 심화 분석 |
| H-REV01 (한도 도달 → 업그레이드 60%) | 심화 분석 |
| H-LI01 (누적 500명+ → 이탈률 60%↓) | 심화 분석 |

### Week 3-4: 협업 + AI 기본 + P0 분석

#### 태스크
| # | 태스크 | 예상 소요 | 담당 |
|---|-------|----------|------|
| 19 | `mention_created` 이벤트 구현 | 2h | BE |
| 20 | `comment_added` 이벤트 구현 | 2h | BE |
| 21 | `feedback_requested` 이벤트 구현 | 1h | BE |
| 22 | `ai_screening_executed` 이벤트 구현 | 2h | FE |
| 23 | `ai_recommendation_accepted` 이벤트 구현 | 2h | FE |
| 24 | `interview_scheduled` 이벤트 구현 | 1h | BE |
| 25 | **P0 코호트 분석 실행** - Activation 행동별 리텐션 비교 | 4h | PM |
| 26 | **Aha Moment 탐색** - H-A01, H-A02 데이터 기반 발견 | 4h | PM |

### Week 5-6: 매출 + 기능 깊이 이벤트

#### 태스크
| # | 태스크 | 예상 소요 | 담당 |
|---|-------|----------|------|
| 27 | `plan_limit_approached` 이벤트 구현 | 2h | BE |
| 28 | `plan_limit_reached` 이벤트 구현 | 2h | BE |
| 29 | `upgrade_prompt_shown` 이벤트 구현 | 2h | FE |
| 30 | `plan_upgraded` 이벤트 구현 | 2h | BE |
| 31 | `chat_message_sent` 이벤트 구현 | 1h | BE |
| 32 | `auto_action_triggered` 이벤트 구현 | 1h | BE |
| 33 | User properties Phase 1 추가 (4개) | 3h | FE+BE |
| 34 | **로그인 빈도-리텐션 상관 분석** (H-R01) | 3h | PM |
| 35 | **팀 크기별 유지율 분석** (H-ACC01) | 3h | PM |
| 36 | **이탈 조기 신호 분석** (H-CH01) | 3h | PM |

### Phase 1 완료 기준
- [ ] 22개 이벤트 정상 추적 확인
- [ ] User properties 15개 (기존 5 + Phase 0의 6 + Phase 1의 4) 정상 업데이트
- [ ] P0 코호트 분석 완료 - Aha Moment 후보 도출
- [ ] H-R01, H-ACC01, H-CH01 패턴 확인
- [ ] 일일 이벤트 볼륨 5,000+ events/day 달성

---

## Phase 2: Action (Week 7-10)

### 목표
- 10개 추가 이벤트 구현 (누적 32개)
- P2 가설 검증을 위한 캠페인/제안 실행
- Customer Health Score 자동 계산 시작

### 검증 대상 가설
| 가설 | 분석 유형 |
|------|----------|
| H-R02 (재참여 캠페인 → 이탈률 20%↓) | 개입 실행 |
| H-REV04 (연간 결제 전환 → 수용률 50%) | 개입 실행 |
| H-AI01 (AI 사용 → 유지율 차이 관찰) | 탐색적 관찰 |

### Week 7-8: 재참여 + 연간 결제 + 성과 이벤트

| # | 태스크 | 예상 소요 | 담당 |
|---|-------|----------|------|
| 37 | `re_engagement_sent` 이벤트 구현 | 2h | BE |
| 38 | `re_engagement_responded` 이벤트 구현 | 2h | BE |
| 39 | `annual_plan_offered` 이벤트 구현 | 1h | FE |
| 40 | `annual_plan_converted` 이벤트 구현 | 1h | BE |
| 41 | `candidate_hired` 이벤트 구현 | 2h | BE |
| 42 | `report_generated` 이벤트 구현 | 1h | FE |
| 43 | **재참여 캠페인 설계 및 실행** (H-R02) | 8h | PM+마케팅 |

### Week 9-10: AI 심화 + Health Score + 검증

| # | 태스크 | 예상 소요 | 담당 |
|---|-------|----------|------|
| 44 | `ai_recommendation_overridden` 이벤트 구현 | 2h | FE |
| 45 | `ai_explanation_viewed` 이벤트 구현 | 1h | FE |
| 46 | `reference_check_completed` 이벤트 구현 | 1h | BE |
| 47 | `application_site_published` 이벤트 구현 | 1h | BE |
| 48 | User properties Phase 2 추가 (3개) | 2h | FE+BE |
| 49 | Customer Health Score 계산 로직 구현 | 8h | BE |
| 50 | 이탈 위험 조기 경고 알림 구현 | 4h | BE |
| 51 | **연간 결제 전환 제안 실행** (H-REV04) | 4h | PM+세일즈 |
| 52 | **AI 사용자 vs 미사용자 리텐션 비교** (H-AI01) | 3h | PM |
| 53 | 전체 이벤트 데이터 품질 감사 | 4h | PM+BE |

### Phase 2 완료 기준
- [ ] 32개 이벤트 정상 추적 확인
- [ ] 일일 이벤트 볼륨 8,000+ events/day 달성
- [ ] Customer Health Score 자동 계산 동작
- [ ] 이탈 위험 알림 시스템 동작
- [ ] 재참여 캠페인 1회+ 실행 및 결과 분석
- [ ] 13개 가설 전체 검증 현황 종합 리포트 작성

---

## Phase 3: Optimize (Week 11+)

### 목표
- 가설 검증 결과 기반 제품 개선 우선순위 결정
- 예측 모델링 (이탈 예측)
- 다음 분기 가설 수립

### 태스크
| # | 태스크 | 예상 소요 |
|---|-------|----------|
| 54 | 13개 가설 검증 결과 종합 리포트 | 8h |
| 55 | Aha Moment 기반 온보딩 개선안 설계 | 8h |
| 56 | 이탈 예측 모델 (H-R01, H-ACC01, H-CH01 데이터 기반) | 16h |
| 57 | Lock-in 강화 전략 수립 (H-LI01, H-E05 결과 기반) | 4h |
| 58 | 고급 세그먼트 분석 (규모별, 행동별) | 8h |
| 59 | 다음 분기 가설 수립 | 4h |

---

## 핵심 수정 파일 총정리

### 신규 생성 파일
| 파일 | Phase | 설명 |
|------|-------|------|
| `round-server/app/subscribers/amplitude_tracking_subscriber.rb` | 0 | Wisper→Amplitude 이벤트 변환 구독자 |
| `when-front/packages/round/analytics/src/events/index.ts` | 0 | 이벤트 함수 re-export |
| `when-front/packages/round/analytics/src/events/user-events.ts` | 0 | user_login, session_started |
| `when-front/packages/round/analytics/src/events/feature-events.ts` | 0 | feature_first_use |
| `when-front/packages/round/analytics/src/events/ai-events.ts` | 1 | ai_screening_executed, ai_recommendation_* |
| `when-front/packages/round/analytics/src/events/plan-events.ts` | 1 | upgrade_prompt_shown, annual_plan_offered |

### 수정 파일
| 파일 | Phase | 변경 내용 |
|------|-------|----------|
| `round-server/config/initializers/wisper.rb` | 0 | AmplitudeTrackingSubscriber 등록 추가 |
| `round-server/config/initializers/amplitude.rb` | 0 | 환경변수 분기 추가 (선택) |
| `when-front/packages/round/analytics/src/analytics.ts` | 0 | `setAnalyticsUser()` user properties 확장 |

---

## 검증 방법

### 1. 개발 환경 검증
```bash
# 로컬에서 Amplitude 이벤트 전송 활성화
ENV['ENABLE_AMPLITUDE']=true rails s
```
- Amplitude Debugger에서 실시간 이벤트 확인
- 이벤트명, 프로퍼티, 사용자 식별 정확성 검증

### 2. 스테이징 환경 검증
- 시나리오별 E2E 테스트 실행
- 이벤트 프로퍼티 null/undefined 체크
- 이벤트 발생 타이밍 및 순서 검증

### 3. 프로덕션 모니터링
| 지표 | 기준 | 체크 주기 |
|------|------|----------|
| 일일 이벤트 볼륨 | Phase 0: 3,000+, Phase 1: 5,000+, Phase 2: 8,000+ | 일간 |
| 이벤트 프로퍼티 null율 | < 5% | 주간 |
| 이벤트 전송 실패율 | < 1% | 일간 |
| 사용자 식별 매칭율 | > 95% | 주간 |

### 4. 데이터 품질 체크리스트
- [ ] 모든 이벤트가 올바른 `user_id`와 함께 전송됨
- [ ] 이벤트 프로퍼티 값이 정의된 enum/range 내에 있음
- [ ] 타임스탬프가 UTC로 정확히 기록됨
- [ ] 중복 이벤트 발생하지 않음 (idempotency)
- [ ] 개인정보(PII)가 이벤트 프로퍼티에 포함되지 않음

---

## 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| Amplitude 일일 이벤트 한도 초과 | 데이터 손실 | Phase별 점진적 확장, 샘플링 적용 검토 |
| 이벤트 전송으로 인한 성능 저하 | UX 악화 | 비동기 전송 (Sidekiq), batch 전송 활용 |
| 이벤트 스키마 변경 시 호환성 | 분석 오류 | 버전 관리, 마이그레이션 기간 운영 |
| 개인정보 이슈 | 법적 리스크 | PII 필터링 로직 필수 적용, 프라이버시 리뷰 |

---

## 변경 이력

| 날짜 | 변경 | 상세 |
|------|------|------|
| 2026-02-13 | 초기 작성 | 25개 가설, 45개 이벤트 기준 로드맵 |
| 2026-02-13 | 가설 연동 수정 | 13개 가설, 32개 이벤트 기준으로 재구성. Phase별 가설 매핑 추가, 코호트 분석 태스크 추가 |

*전체 소요 예상: 약 10주 (2.5개월)*
*총 이벤트 수: Phase 0(10) + Phase 1(12) + Phase 2(10) = 32개*
