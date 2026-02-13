# 데이터 기반 제품 개선: 가설 수립 & 데이터 택소노미 설계

**상태:** Planning
**타임라인:** 2026-02-13 - 2026-05-15 (3개월)
**Owner:** 김재현 (Product Manager)
**Stakeholders:** 개발팀 (백엔드/프론트엔드), 데이터 분석팀, 세일즈팀

## 목표

Round HR은 350+ 고객사를 보유한 AI 보강형 ATS이지만, **핵심 제품 행동 이벤트가 거의 추적되지 않고 있다.** 현재 Amplitude가 프론트엔드/백엔드 양쪽에 설치되어 있으나, 기본 user properties(email, name, plan, stage, created_at)만 기록하고 있어 데이터 기반 의사결정이 불가능한 상태다.

**수집 → 측정 → 분석 → 개선**의 사이클을 구축하여, 가설 기반으로 제품 사용성과 비즈니스 메트릭을 체계적으로 개선한다.

### 기술적 기반
- **백엔드**: `amplitude-api` gem + 92+ Wisper 이벤트 구독자 (`round-server/config/initializers/wisper.rb`)
- **프론트엔드**: `@round/analytics` 패키지의 `logAnalyticsEvent()` 함수 (`when-front/packages/round/analytics/src/analytics.ts`)
- **통합 추적**: Amplitude, GTM, Facebook Pixel, HubSpot에 동시 전송

## 현재 상태
- [x] 가설 수립 완료 (25개 → 8개 선별 → PM 리뷰 → **13개 핵심 가설**)
- [x] 데이터 택소노미 설계 완료 (**32개 이벤트**)
- [x] 구현 로드맵 작성 완료 (10주, 3 Phase)
- [x] 성공 지표 정의 완료 (북스타 메트릭 6개)
- [ ] 개발팀 리뷰 및 피드백
- [ ] Phase 0 구현 시작 (Foundation - 10개 이벤트)
- [ ] Phase 1 구현 (Depth - 12개 이벤트)
- [ ] Phase 2 구현 (Action - 10개 이벤트)
- [ ] Analytics 대시보드 구성 완료

## 가설 구조

### 13개 핵심 가설 (P0/P1/P2)

| 우선순위 | 가설 수 | 분석 유형 | 내용 |
|---------|--------|----------|------|
| **P0** | 6개 | 코호트 분석 | Activation(2), Engagement(1), Retention(1), Account(1), Churn(1) |
| **P1** | 5개 | 심화 분석 | Engagement(2), Retention(1), Revenue(1), Lock-in(1) |
| **P2** | 3개 | 개입 실행 | Retention(1), Revenue(1), AI(1) |

### 핵심 원칙
1. **성공 + 실패 패턴 균형** - 성공한 고객뿐 아니라 이탈하는 고객의 패턴도 분석
2. **User + Account 균형** - 개인 사용자뿐 아니라 팀/계정 단위 분석 포함
3. **Aha Moment는 가정이 아니라 발견** - 데이터에서 자연스럽게 도출
4. **검증 후 행동 가능** - 가설이 맞다면 제품의 어떤 부분을 어떻게 바꿀 것인지 명확

## 폴더 구조
- **[product-analytics/](./product-analytics/)** - 핵심 산출물
  - `hypotheses.md` - 핵심 가설 13개 (Activation, Engagement, Retention, Account, Churn, Revenue, AI)
  - `data-taxonomy.md` - 이벤트 택소노미 32개 및 추적 설계
  - `data-taxonomy.xlsx` - 택소노미 엑셀 (이벤트, 매핑, 프로퍼티, 퍼널, 가설 요약)
  - `implementation-roadmap.md` - 주차별 구현 로드맵 (Phase 0-3)
  - `success-metrics.md` - 북스타 메트릭 6개 및 Phase별 검증 방법
  - `analysis/` - 데이터 분석 및 인사이트
  - `dashboards/` - Amplitude 대시보드 링크
- **[assumptions/](./assumptions/)** - 가설 검증 계획 및 결과
- **[prd/](./prd/)** - 이벤트 추적 구현 PRD
- **[tasks/](./tasks/)** - 구현 태스크

## 빠른 링크
- [가설 13개](./product-analytics/hypotheses.md)
- [데이터 택소노미](./product-analytics/data-taxonomy.md)
- [택소노미 엑셀](./product-analytics/data-taxonomy.xlsx)
- [구현 로드맵](./product-analytics/implementation-roadmap.md)
- [성공 지표](./product-analytics/success-metrics.md)

## 핵심 의사결정
1. Wisper 이벤트 버스를 활용한 백엔드 추적 (신규 구독자 추가 방식)
2. 기존 `logAnalyticsEvent()` 함수 활용한 프론트엔드 추적
3. Phase별 점진적 이벤트 확장 (10개 → 22개 → 32개)
4. 이벤트 네이밍: `[Object]_[Action](_[Context])` snake_case 컨벤션
5. AI 가설은 최소 1개만 관찰용으로 유지 (핵심 워크플로우 우선)
6. 가설 목표 수치는 현실적 수준으로 보수적 설정

## 핵심 숫자 요약

| 항목 | 수치 |
|------|------|
| 가설 | 13개 (P0: 6, P1: 5, P2: 3) |
| 이벤트 (Phase 0) | 10개 (BE 6 + FE 4) |
| 이벤트 (최종) | 32개 |
| 사용자 프로퍼티 (현재→목표) | 5개 → 18개 |
| 퍼널 | 4개 (온보딩, 주간 워크플로우, Account 활성화, 업그레이드) |
| 구현 기간 | 약 10주 |

---
*Created: 2026-02-13*
*Last Updated: 2026-02-13 (13개 가설 기준 전체 재구성)*
*Template: initiatives/_templates/initiative-template*
