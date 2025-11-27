# 동적 개념 리스트 (V1.5)

**작성일:** 2025-11-27
**작성자:** Terry
**버전:** v0.1.0
**상태:** Planning

---

## 📋 개요

### 동적 개념의 정의

**동적 개념 (Dynamic Concepts):** ATS 채용 과정 중 생성되는 **시간에 따라 변화하는 데이터**를 표현하는 온톨로지 개념

**정적 개념 vs 동적 개념:**

| 구분 | 정적 개념 (V1) | 동적 개념 (V1.5) |
|------|--------------|---------------|
| **특성** | 정의, 템플릿, 표준 | 이벤트, 기록, 패턴 |
| **변화** | 거의 변하지 않음 | 채용마다 생성됨 |
| **예시** | Competency 정의<br>"PostgreSQL이란 무엇인가" | Evaluation Record<br>"제임스가 후보자 A의 PostgreSQL을 4.5점으로 평가" |
| **데이터 소스** | HR 전문가 정의<br>산업 표준 참조 | **ATS 사용 중 자동 수집**<br>(지원, 면접, 평가, 결정) |
| **차별화** | Low (경쟁사도 가능) | **High (ATS만 가능)** |

---

## 🎯 동적 개념의 전략적 가치

### ATS만의 독점 자산

**일반 HR 온톨로지 (정적):**
- "Backend Engineer는 PostgreSQL Advanced가 필요하다" (정의)

**ATS 온톨로지 (정적 + 동적):**
- "Backend Engineer는 PostgreSQL Advanced가 필요하다" (정의)
- **+ "지난 6개월 합격자 PostgreSQL 평균 4.2/5"** (동적 데이터)
- **+ "PostgreSQL 4점 미만은 모두 탈락 (15명)"** (패턴)
- **+ "면접관 제임스는 PostgreSQL 평가 시 0.2점 관대"** (면접관 패턴)

**결과:**
- Borry가 "PostgreSQL Advanced" 요구사항을 **데이터 근거**로 설정 가능
- "왜 Advanced인가?"라는 질문에 **"과거 데이터가 말한다"**로 답변

---

## 📊 V1.5 동적 개념 전체 리스트 (9개)

### 우선순위 매트릭스

| 개념 ID | 개념 이름 | 카테고리 | 우선순위 | 차별화 임팩트 | 구현 난이도 | Week 5 순서 |
|---------|----------|---------|---------|-------------|----------|-----------|
| **C-008** | **Candidate** | Candidate Journey | **P0** | High | Low | 1순위 |
| C-009 | Application | Candidate Journey | P1 | Medium | Low | 7순위 |
| **C-010** | **Interview Stage** | Candidate Journey | **P0** | High | Medium | 5순위 |
| **C-011** | **Lead Time** | Candidate Journey | **P0** | **Critical** | Low | 2순위 |
| C-012 | Interview | Evaluation | P0 | High | Medium | 6순위 |
| **C-013** | **Evaluation Record** | Evaluation | **P0** | **Critical** | Medium | 3순위 |
| **C-014** | **Competency Assessment** | Evaluation | **P0** | **Critical** | Medium | 4순위 |
| C-015 | Interviewer | Evaluation | P1 | High | Low | 8순위 |
| **C-016** | **Hiring Decision** | Outcome | **P0** | **Critical** | Low | 9순위 |

**P0 개념 (7개):** Week 5 Day 1-4 집중 작성
**P1 개념 (2개):** Week 5 Day 5 작성

---

## 📁 개념별 상세 정보

### C-008: Candidate (지원자) - P0

**카테고리:** Candidate Journey
**우선순위:** P0 (Critical)
**Week 5 순서:** 1순위

#### 정의
채용 프로세스에 지원한 개인의 정보 및 이력

#### 핵심 속성
- `candidateId` (String, 필수): 고유 식별자
- `name` (String, 필수): 지원자 이름
- `email` (String, 필수): 연락처
- `resumeUrl` (String, 선택): 이력서 파일 URL
- `appliedDate` (DateTime, 필수): 지원일
- `experienceYears` (Number, 선택): 총 경력 연수
- `skills` (Array<String>, 선택): 자가 보고 스킬 (예: "PostgreSQL", "React")

#### 관계
- `appliesTo` Position
- `hasApplication` Application
- `participatesIn` Interview
- `receivesEvaluation` Evaluation Record
- `receivesDecision` Hiring Decision

#### 해결하는 DCQ
- DCQ-05: "지난 6개월 Backend Senior 합격자의 평균 Competency 점수는?"
- DCQ-08: "PostgreSQL 4점 이상인데 탈락한 케이스는 왜?"

#### 구현 난이도
**Low** - 기본 엔티티, 복잡한 로직 없음

---

### C-009: Application (지원) - P1

**카테고리:** Candidate Journey
**우선순위:** P1 (High)
**Week 5 순서:** 7순위

#### 정의
특정 Position에 대한 Candidate의 지원 행위

#### 핵심 속성
- `applicationId` (String, 필수)
- `candidateId` (String, 필수)
- `positionId` (String, 필수)
- `appliedDate` (DateTime, 필수)
- `source` (String, 선택): 지원 경로 (예: "LinkedIn", "Referral")
- `status` (String, 필수): "Applied", "Screening", "Interview", "Offer", "Rejected"

#### 관계
- `submittedBy` Candidate
- `appliesFor` Position
- `leadsTo` Interview Stage

#### 해결하는 DCQ
- DCQ-01: "Senior Backend Engineer 채용의 평균 리드타임은?" (시작점)

#### 구현 난이도
**Low** - Application Status 트래킹 로직 필요

---

### C-010: Interview Stage (전형 단계) - P0

**카테고리:** Candidate Journey
**우선순위:** P0 (Critical)
**Week 5 순서:** 5순위

#### 정의
채용 프로세스의 특정 단계 (예: 1차 면접, 2차 면접, 과제)

#### 핵심 속성
- `stageId` (String, 필수)
- `stageName` (String, 필수): "1차 기술 면접", "2차 컬처핏 면접", "과제 제출"
- `stageOrder` (Number, 필수): 단계 순서 (1, 2, 3...)
- `stageType` (String, 필수): "Phone Screen", "Technical", "Behavioral", "Assignment"
- `expectedDuration` (Number, 선택): 예상 소요 시간 (분)

#### 관계
- `belongsTo` Position
- `hosts` Interview (여러 면접 이벤트)
- `precedes` Interview Stage (다음 단계)

#### 해결하는 DCQ
- **DCQ-01**: "Senior Backend Engineer 채용의 평균 리드타임은?" (단계별 분해)

#### 구현 난이도
**Medium** - 단계 간 순서 관계, Lead Time 계산 로직 필요

---

### C-011: Lead Time (리드타임) - P0 ⭐

**카테고리:** Candidate Journey
**우선순위:** P0 (Critical)
**Week 5 순서:** 2순위

#### 정의
특정 단계에서 다음 단계까지 소요된 시간

#### 핵심 속성
- `leadTimeId` (String, 필수)
- `candidateId` (String, 필수)
- `fromStage` (String, 필수): 시작 단계
- `toStage` (String, 필수): 종료 단계
- `startDate` (DateTime, 필수)
- `endDate` (DateTime, 필수)
- `durationDays` (Number, 자동 계산): 소요 일수

#### 관계
- `measuresTransition` Interview Stage → Interview Stage
- `appliesTo` Candidate

#### 해결하는 DCQ
- **DCQ-01**: "Senior Backend Engineer 채용의 평균 리드타임은?" ← **핵심**
- DCQ-02: "어떤 Competency 평가가 가장 오래 걸리는가?"

#### 구현 난이도
**Low** - 날짜 계산만 필요, 비즈니스 로직 단순

#### 차별화 포인트
**Critical** - 채용 과정 병목 발견의 핵심 개념

---

### C-012: Interview (면접 이벤트) - P0

**카테고리:** Evaluation
**우선순위:** P0 (Critical)
**Week 5 순서:** 6순위

#### 정의
특정 Candidate와 Interviewer 간의 면접 이벤트

#### 핵심 속성
- `interviewId` (String, 필수)
- `candidateId` (String, 필수)
- `interviewerId` (String, 필수)
- `stageId` (String, 필수)
- `interviewDate` (DateTime, 필수)
- `duration` (Number, 선택): 실제 면접 시간 (분)
- `format` (String, 선택): "In-person", "Video", "Phone"

#### 관계
- `involves` Candidate
- `conductedBy` Interviewer
- `belongsToStage` Interview Stage
- `produces` Evaluation Record (여러 개)

#### 해결하는 DCQ
- DCQ-02: "어떤 Competency 평가가 가장 오래 걸리는가?"
- DCQ-04: "면접관 제임스는 Communication 평가 시 얼마나 엄격한가?"

#### 구현 난이도
**Medium** - 면접 일정 관리, Evaluation Record 연결

---

### C-013: Evaluation Record (평가 기록) - P0 ⭐

**카테고리:** Evaluation
**우선순위:** P0 (Critical)
**Week 5 순서:** 3순위

#### 정의
면접관이 특정 Competency에 대해 Candidate를 평가한 기록

#### 핵심 속성
- `evaluationId` (String, 필수)
- `interviewId` (String, 필수)
- `candidateId` (String, 필수)
- `interviewerId` (String, 필수)
- `competencyId` (String, 필수): 평가한 역량
- `score` (Number, 필수): 점수 (1-5 척도)
- `notes` (String, 선택): 평가 메모
- `timestamp` (DateTime, 필수)

#### 관계
- `createdDuring` Interview
- `assesses` Candidate
- `evaluates` Competency
- `providedBy` Interviewer

#### 해결하는 DCQ
- **DCQ-04**: "면접관 제임스는 Communication 평가 시 얼마나 엄격한가?" ← **핵심**
- **DCQ-05**: "지난 6개월 Backend Senior 합격자의 평균 Competency 점수는?" ← **핵심**
- **DCQ-06**: "Communication 3점 받은 후보자의 최종 합격률은?" ← **핵심**

#### 구현 난이도
**Medium** - 복수 관계 (Interview, Candidate, Competency, Interviewer), 집계 쿼리 필요

#### 차별화 포인트
**Critical** - 면접관 패턴 분석, 합격 벤치마크의 핵심 데이터

---

### C-014: Competency Assessment - P0

**카테고리:** Evaluation
**우선순위:** P0 (Critical)
**Week 5 순서:** 4순위

#### 정의
Candidate의 특정 Competency에 대한 종합 평가 (여러 Evaluation Record의 집계)

#### 핵심 속성
- `assessmentId` (String, 필수)
- `candidateId` (String, 필수)
- `competencyId` (String, 필수)
- `averageScore` (Number, 자동 계산): 모든 면접관 평가 평균
- `evaluationCount` (Number, 자동 계산): 평가 횟수
- `scoreVariance` (Number, 자동 계산): 면접관 간 점수 편차

#### 관계
- `aggregatesFrom` Evaluation Record (여러 개)
- `assessesCandidate` Candidate
- `evaluatesCompetency` Competency

#### 해결하는 DCQ
- DCQ-05: "지난 6개월 Backend Senior 합격자의 평균 Competency 점수는?"
- DCQ-06: "Communication 3점 받은 후보자의 최종 합격률은?"

#### 구현 난이도
**Medium** - 집계 로직 (평균, 분산), Evaluation Record와 연동

#### 차별화 포인트
**Critical** - 면접관 간 불일치 발견, Pass/Fail 기준점 설정

---

### C-015: Interviewer (면접관) - P1

**카테고리:** Evaluation
**우선순위:** P1 (High)
**Week 5 순서:** 8순위

#### 정의
면접을 진행하는 내부 직원

#### 핵심 속성
- `interviewerId` (String, 필수)
- `name` (String, 필수)
- `title` (String, 선택): 직급 (예: "Backend Tech Lead")
- `department` (String, 선택): 소속 부서
- `experienceYears` (Number, 선택): 면접 경력 (년)

#### 관계
- `conducts` Interview
- `provides` Evaluation Record

#### 해결하는 DCQ
- **DCQ-04**: "면접관 제임스는 Communication 평가 시 얼마나 엄격한가?"

#### 구현 난이도
**Low** - 기본 엔티티, 간단한 속성

---

### C-016: Hiring Decision (채용 결정) - P0 ⭐

**카테고리:** Outcome
**우선순위:** P0 (Critical)
**Week 5 순서:** 9순위

#### 정의
Candidate에 대한 최종 채용 결정 (합격/불합격 및 사유)

#### 핵심 속성
- `decisionId` (String, 필수)
- `candidateId` (String, 필수)
- `positionId` (String, 필수)
- `decision` (String, 필수): "Hired", "Rejected", "Offer Extended", "Offer Declined"
- `decisionDate` (DateTime, 필수)
- `primaryReason` (String, 선택): 결정 이유
- `detailedNotes` (String, 선택): 상세 메모

#### 관계
- `decidesOn` Candidate
- `forPosition` Position
- `basedOn` Competency Assessment (여러 개)

#### 해결하는 DCQ
- **DCQ-06**: "Communication 3점 받은 후보자의 최종 합격률은?" ← **핵심**
- **DCQ-07**: "Backend Senior 탈락 사유 Top 3는?" ← **핵심**
- **DCQ-08**: "PostgreSQL 4점 이상인데 탈락한 케이스는 왜?" ← **핵심**

#### 구현 난이도
**Low** - 단순 결정 기록, 사유 텍스트

#### 차별화 포인트
**Critical** - 탈락 패턴 분석, Hiring Criteria 정교화의 핵심

---

## 🔗 동적 개념 간 관계 (Relationships)

### 핵심 관계 정의

| 관계 ID | 관계 정의 | 설명 | 해결하는 DCQ |
|---------|----------|------|------------|
| **R-003** | Candidate participatesIn Interview | 지원자가 면접에 참여 | DCQ-01, 02, 04 |
| **R-004** | Interview produces Evaluation Record | 면접에서 평가 기록 생성 | DCQ-04, 05, 06 |
| **R-005** | Evaluation Record evaluates Competency | 평가 기록이 역량 평가 | DCQ-04, 05, 06 |
| **R-006** | Hiring Decision basedOn Competency Assessment | 채용 결정이 역량 평가 기반 | DCQ-06, 07, 08 |

### 관계 다이어그램 (간단)

```
Candidate
  └─ appliesFor → Position
  └─ participatesIn → Interview
       └─ produces → Evaluation Record
            └─ evaluates → Competency
            └─ aggregatesTo → Competency Assessment
                 └─ influencesDecision → Hiring Decision
```

---

## 📅 Week 5 작성 순서 (우선순위 기반)

### Day 1-2: P0 개념 4개 (Critical)

1. **Candidate** (C-008) - 기반 엔티티
2. **Lead Time** (C-011) - DCQ-01 핵심
3. **Evaluation Record** (C-013) - DCQ-04~06 핵심
4. **Hiring Decision** (C-016) - DCQ-06~08 핵심

**목표:** Critical 개념 4개 완성으로 DCQ-01, 04~08 답변 가능

---

### Day 3-4: P0 개념 2개 + P1 개념 시작

5. **Interview Stage** (C-010) - DCQ-01 상세 분해
6. **Interview** (C-012) - Evaluation Record 연결
7. **Competency Assessment** (C-014) - 집계 로직

**목표:** 모든 P0 개념 완성

---

### Day 5: P1 개념 2개 + 관계 정의

8. **Interviewer** (C-015) - DCQ-04 보조
9. **Application** (C-009) - DCQ-01 시작점

**+ 관계 정의:**
- [ ] R-003~R-006 정의
- [ ] 관계 다이어그램 작성

**목표:** 전체 9개 개념 + 4개 관계 완성, Borry 검토 준비

---

## ✅ 작성 가이드라인

### 각 개념 문서에 포함할 내용

1. **개념 정의** (한 문장 + 상세 설명)
2. **핵심 속성** (테이블 형식)
3. **관계** (상위/하위/관련 개념)
4. **해결하는 DCQ** (최소 1개 이상)
5. **실제 사례** (최소 2개)
6. **구현 난이도** (Low/Medium/High)
7. **차별화 포인트** (왜 이 개념이 중요한가)

### 템플릿 사용

`02-conceptualization/concepts/_template.md` 기반으로 작성

**수정 사항:**
- `category` 필드에 "DYNAMIC_DATA" 추가
- `해결하는 DCQ` 섹션 추가

---

## 🚧 주의사항

### V1 정적 개념과의 충돌 방지

**정적 개념:**
- Competency (C-004): "PostgreSQL이란 무엇인가" (정의)

**동적 개념:**
- Evaluation Record (C-013): "제임스가 후보자 A의 PostgreSQL을 4.5점으로 평가" (기록)
- Competency Assessment (C-014): "후보자 A의 PostgreSQL 평균 4.2점" (집계)

**명확한 구분:**
- 정적 = 정의, 템플릿, 표준
- 동적 = 이벤트, 기록, 패턴

### 데이터 프라이버시

**샘플 데이터 수집 시 주의:**
- Candidate 이름 → 익명화 (예: "Candidate A")
- 이메일 → 마스킹 (예: "c***@example.com")
- 상세 메모 → 민감 정보 제거

---

## 📚 참고 자료

### 전략 문서
- [동적 데이터 전략](../../dynamic-data-strategy.md)
- [V1.5 Scope](../../01-specification/v1-5-scope.md)

### 명세 문서
- [Competency Questions](../../01-specification/competency-questions.md) - DCQ-01~08

### V1 정적 개념 (참고)
- [Competency](./competency.md) - C-004
- [Position](./position.md) - C-003

---

## 📝 변경 이력

| 날짜 | 변경 내용 | 변경자 | 이유 |
|------|----------|--------|------|
| 2025-11-27 | 동적 개념 리스트 초안 작성 (9개 개념) | Terry | V1.5 범위 정의, Week 5 작업 계획 |

---

*동적 개념은 ATS만이 가진 독점 자산입니다. 이 9개 개념을 정의하고 데이터를 축적함으로써 경쟁사가 따라올 수 없는 차별화를 구현합니다.*
