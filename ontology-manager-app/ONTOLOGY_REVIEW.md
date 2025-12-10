# Ontology Manager App - 온톨로지 전문가 리뷰 및 개선 가이드

**작성일:** 2025-12-10
**검토자:** Forry (Ontology Design Specialist)
**대상 독자:** 개발팀
**목적:** 온톨로지 표준 준수 및 아키텍처 개선

---

## Executive Summary

온톨로지 매니저 앱의 현재 구조는 **ATS 도메인 모델링은 우수**하나, **온톨로지 이론 관점에서 개선이 필요**합니다.

### 종합 평가: 3.1/5 (61%)

| 평가 항목 | 점수 | 상태 |
|-----------|------|------|
| ATS 도메인 적합성 | 4.5/5 | ✅ 우수 |
| 시각화 품질 | 4/5 | ✅ 양호 |
| 확장성 | 3/5 | ⚠️ 개선 필요 |
| 온톨로지 표준 준수 | 2.5/5 | ❌ 개선 필요 |
| 타입 안전성 | 2/5 | ❌ 개선 필요 |
| 유지보수성 | 2.5/5 | ❌ 개선 필요 |

### 핵심 발견사항

**✅ 강점:**
- Candidate, Job Posting, Interview 등 ATS 핵심 개념의 도메인 모델링 탁월
- Schema View / Graph View 이중 시각화 패러다임 제공
- React Flow 기반 인터랙티브 UX 우수

**❌ 개선 필요:**
- 프로퍼티 재사용 불가 (email이 3번 중복 정의됨)
- TypeScript 타입 안전성 부족 (순환 참조 가능성)
- Object Property 미지원 (클래스 간 참조 표현 한계)
- Schema ↔ Graph View 전환 시 정보 손실

---

## 1. 핵심 문제점 (Critical Issues)

### Issue #1: 타입 안전성 부족 (Priority: HIGH)

**문제:**

```typescript
// src/types/ontology.ts:1
export interface OntologyNodeData {
    label: string;
    type?: 'class' | 'property';  // ❌ optional이라 타입 가드 불가
    properties: PropertyDefinition[];  // ❌ 프로퍼티 노드도 이 배열을 가짐
    rules: LogicRule[];
    description?: string;
}
```

**왜 문제인가:**
1. `type`이 optional이라 런타임에 `undefined` 가능 → 방어 코드 필요
2. 프로퍼티 노드(`type='property'`)도 `properties` 배열을 가짐 → 의미론적 혼란
3. 프로퍼티의 프로퍼티가 가능한 구조 → 순환 참조 위험
4. TypeScript의 타입 시스템을 제대로 활용하지 못함

**실제 코드에서의 영향:**

```typescript
// src/stores/useOntologyStore.ts:504
// Graph View로 전환 시
propertyNodes.push({
    id: propNodeId,
    type: 'graphNode',
    data: {
        label: prop.name,
        type: 'property',
        properties: [],  // ❌ 비어있지만 구조적으로 존재
        rules: []
    }
});
```

**해결 방안:**

```typescript
// 개선안: Union Type 사용
interface BaseNodeData {
    label: string;
    description?: string;
}

export interface ClassNodeData extends BaseNodeData {
    kind: 'class';  // 'type' 대신 'kind', required
    properties: PropertyDefinition[];
    rules: LogicRule[];
}

export interface PropertyNodeData extends BaseNodeData {
    kind: 'property';
    dataType: PropertyType;
    required: boolean;
    // properties 배열 제거 → 순환 참조 방지
}

export type OntologyNodeData = ClassNodeData | PropertyNodeData;

// 타입 가드 추가
export function isClassNode(node: OntologyNodeData): node is ClassNodeData {
    return node.kind === 'class';
}

export function isPropertyNode(node: OntologyNodeData): node is PropertyNodeData {
    return node.kind === 'property';
}
```

**적용 예시:**

```typescript
// 타입 안전한 코드
function handleNodeClick(node: Node<OntologyNodeData>) {
    if (isClassNode(node.data)) {
        // TypeScript가 자동으로 ClassNodeData로 인식
        console.log('Properties:', node.data.properties);  // ✅ OK
    } else {
        // PropertyNodeData로 인식
        console.log('Data type:', node.data.dataType);  // ✅ OK
        // console.log(node.data.properties);  // ❌ 컴파일 에러 (존재하지 않음)
    }
}
```

**예상 작업량:** 2-3일
**영향 범위:** `types/ontology.ts`, `stores/useOntologyStore.ts`, `components/ClassNode.tsx`, `components/GraphNode.tsx`

---

### Issue #2: 프로퍼티 재사용 불가 (Priority: MEDIUM)

**문제:**

현재 구조에서는 같은 의미의 프로퍼티가 여러 클래스에 중복 정의됩니다.

```typescript
// src/stores/useOntologyStore.ts:49-250
// Candidate 클래스
{
    id: 'candidate',
    data: {
        properties: [
            { id: 'c2', name: 'email', type: 'text' }  // ID: c2
        ]
    }
}

// Recruiter 클래스
{
    id: 'recruiter',
    data: {
        properties: [
            { id: 'r2', name: 'email', type: 'text' }  // ID: r2 (다른 ID!)
        ]
    }
}

// Interviewer 클래스
{
    id: 'interviewer',
    data: {
        properties: [
            { id: 'i2', name: 'email', type: 'text' }  // ID: i2 (또 다른 ID!)
        ]
    }
}
```

**왜 문제인가:**

1. **온톨로지 원칙 위반:** OWL/RDFS에서는 `email`이 재사용 가능한 공통 프로퍼티로 정의됨
2. **Graph View 비효율:** 3개의 독립적인 `email` 노드가 생성됨
3. **유지보수 문제:** email의 정의를 변경하려면 3곳을 모두 수정해야 함
4. **의미론 손실:** "email이 공통 개념"이라는 지식을 온톨로지가 표현하지 못함

**Graph View에서의 문제:**

```
[Candidate] ----> [email (c2)]
[Recruiter] ----> [email (r2)]
[Interviewer] --> [email (i2)]

❌ 3개의 email 노드가 생성됨
✅ 이상적: 1개의 email 프로퍼티를 3개 클래스가 공유
```

**해결 방안: 전역 프로퍼티 풀 (Global Property Pool)**

```typescript
// 스토어 구조 개선
interface OntologyState {
    // 기존
    nodes: Node<ClassNodeData>[];
    edges: Edge<OntologyEdgeData>[];

    // 새로 추가: 전역 프로퍼티 풀
    globalProperties: Map<string, PropertyDefinition>;

    // 클래스-프로퍼티 연결 (다대다 관계)
    classPropertyLinks: Array<{
        classId: string;
        propertyId: string;  // globalProperties의 키
        required: boolean;  // 클래스별로 다를 수 있음
        constraints?: ValidationRule[];
    }>;
}
```

**사용 예시:**

```typescript
// 1. 전역 프로퍼티 정의 (1회만)
globalProperties.set('email', {
    id: 'email',
    name: 'email',
    type: 'text',
    description: '이메일 주소'
});

// 2. 여러 클래스에서 재사용
classPropertyLinks.push(
    { classId: 'candidate', propertyId: 'email', required: true },
    { classId: 'recruiter', propertyId: 'email', required: true },
    { classId: 'interviewer', propertyId: 'email', required: false }  // 클래스별 required 설정
);
```

**Graph View 렌더링:**

```typescript
// 프로퍼티 노드는 1개만 생성
globalProperties.forEach(prop => {
    propertyNodes.push({
        id: prop.id,  // 'email' (중복 없음)
        type: 'graphNode',
        data: {
            kind: 'property',
            label: prop.name,
            dataType: prop.type
        }
    });
});

// 엣지로 연결
classPropertyLinks.forEach(link => {
    edges.push({
        source: link.classId,
        target: link.propertyId,
        data: { required: link.required }
    });
});

// 결과: [Candidate] ──> [email] <── [Recruiter]
//                          ↑
//                   [Interviewer]
```

**예상 작업량:** 5-7일 (마이그레이션 포함)
**영향 범위:** `types/ontology.ts`, `stores/useOntologyStore.ts`, `components/ClassNode.tsx`, UI 전체

---

### Issue #3: Object Property 미지원 (Priority: MEDIUM)

**문제:**

현재 `PropertyType`은 원시 타입만 지원합니다.

```typescript
// src/types/ontology.ts:10
export type PropertyType = 'text' | 'number' | 'date' | 'boolean';
```

다른 클래스를 참조하는 프로퍼티를 표현할 수 없습니다.

**실무 시나리오:**

```typescript
// 현재 방식: 문자열 ID로만 참조 가능
{
    id: 'candidate',
    properties: [
        { name: 'assigned_recruiter_id', type: 'text' }  // ❌ 의미론 손실
    ]
}

// 문제점:
// - 'assigned_recruiter_id'가 Recruiter 클래스를 참조한다는 정보 없음
// - 타입 검증 불가능 (실제로 Recruiter ID인지 확인 불가)
// - 쿼리 시 조인 불가능
```

**해결 방안 1: PropertyType 확장**

```typescript
export type PropertyType =
    | 'text'
    | 'number'
    | 'date'
    | 'boolean'
    | { object: string };  // 다른 클래스 참조

// 사용 예시
{
    name: 'assigned_recruiter',
    type: { object: 'recruiter' },  // Recruiter 클래스 참조
    required: true
}
```

**해결 방안 2: Edge로 표현 (권장)**

```typescript
// PropertyDefinition 대신 Edge 사용
edges: [
    {
        source: 'candidate',
        target: 'recruiter',
        label: 'ASSIGNED_TO',
        data: {
            cardinality: 'N:1',  // Many candidates to One recruiter
            propertyName: 'assignedRecruiter'
        }
    }
]
```

**두 방식의 명확한 분리:**

```typescript
// 규칙: Object Property는 반드시 Edge로 표현
// PropertyDefinition은 Data Property만 (원시 타입)

// ❌ Bad: 중복 정의
properties: [
    { name: 'recruiter_id', type: 'text' }
]
edges: [
    { source: 'candidate', target: 'recruiter', label: 'ASSIGNED_TO' }
]

// ✅ Good: Edge만 사용
edges: [
    {
        source: 'candidate',
        target: 'recruiter',
        label: 'ASSIGNED_TO',
        data: { propertyName: 'assignedRecruiter' }
    }
]
```

**예상 작업량:** 3-4일
**영향 범위:** `types/ontology.ts`, 기존 initialNodes 데이터 검토 및 마이그레이션

---

### Issue #4: 양방향 변환 시 정보 손실 (Priority: LOW)

**문제:**

Schema View → Graph View 전환 시 프로퍼티의 메타데이터가 손실됩니다.

```typescript
// src/stores/useOntologyStore.ts:519-530
// 원본 PropertyDefinition
{
    id: 'c1',
    name: 'name',
    type: 'text',      // ✅
    required: true,    // ✅
    description: '지원자 이름'  // ✅
}

// Graph View 노드로 변환
{
    label: 'name',  // ✅
    type: 'property',  // ✅
    description: '지원자 이름',  // ✅
    properties: [],
    rules: []
    // ❌ type: 'text' 정보 손실
    // ❌ required: true 정보 손실
}
```

**왜 문제인가:**

1. Graph View에서 프로퍼티의 데이터 타입을 알 수 없음
2. required 플래그가 시각화되지 않음
3. Graph View에서 편집 시 원본 정보 복원 불가능

**해결 방안:**

```typescript
// PropertyNodeData에 원본 정보 보존
export interface PropertyNodeData extends BaseNodeData {
    kind: 'property';
    label: string;

    // 메타데이터 보존
    metadata: {
        dataType: PropertyType;  // 'text', 'number', etc.
        required: boolean;
        defaultValue?: any;
    };

    // 역변환을 위한 추적 정보
    originalDefinitionId: string;
    parentClassId: string;
}
```

**변환 로직 개선:**

```typescript
// Schema → Graph (정보 보존)
const propNode: PropertyNodeData = {
    kind: 'property',
    label: prop.name,
    description: prop.description,
    metadata: {
        dataType: prop.type,
        required: prop.required
    },
    originalDefinitionId: prop.id,
    parentClassId: classNode.id
};

// Graph → Schema (정보 복원)
const propDef: PropertyDefinition = {
    id: propNode.originalDefinitionId,
    name: propNode.label,
    type: propNode.metadata.dataType,
    required: propNode.metadata.required,
    description: propNode.description
};
```

**UI 개선:**

```typescript
// src/components/GraphNode.tsx
// 데이터 타입별 색상 구분
const getPropertyColor = (dataType: PropertyType) => {
    switch(dataType) {
        case 'text': return 'bg-green-500';
        case 'number': return 'bg-purple-500';
        case 'date': return 'bg-yellow-500';
        case 'boolean': return 'bg-red-500';
    }
};

// Required 프로퍼티에 별표 표시
{node.data.metadata?.required && <span className="text-red-500">*</span>}
```

**예상 작업량:** 2-3일
**영향 범위:** `types/ontology.ts`, `stores/useOntologyStore.ts`, `components/GraphNode.tsx`

---

## 2. 온톨로지 이론 배경 (For Context)

### 2.1 표준 온톨로지 프레임워크와의 비교

**OWL (Web Ontology Language) 기준:**

| OWL 개념 | 현재 구현 | 상태 |
|----------|-----------|------|
| `owl:Class` | `OntologyNodeData` with `type='class'` | ✅ 적합 |
| `owl:DatatypeProperty` | `PropertyDefinition` | ⚠️ 재사용 불가 |
| `owl:ObjectProperty` | Edge 일부만 | ❌ 미비 |
| `rdfs:domain` | 암묵적 (프로퍼티가 속한 클래스) | ⚠️ 불명확 |
| `rdfs:range` | `PropertyType` | ✅ 적합 |
| `rdfs:subClassOf` | 미지원 | ❌ 없음 |
| `rdfs:subPropertyOf` | 미지원 | ❌ 없음 |

### 2.2 현재 구조의 패러다임

**Schema View: "Property-as-Attribute" 모델**
- 전통적인 데이터베이스 스키마 모델링 방식
- UML 클래스 다이어그램과 유사
- 장점: 직관적, 컴팩트한 시각화
- 단점: 프로퍼티 재사용 불가, 프로퍼티 간 관계 표현 불가

**Graph View: "Property-as-Entity" 모델**
- RDF Triple Store 방식에 가까움
- 지식 그래프(Knowledge Graph) 접근
- 장점: 프로퍼티 재사용 가능, 메타 레벨 관계 표현 가능
- 단점: 그래프 복잡도 급증, 시각적 혼잡

**결론:** 두 패러다임의 하이브리드 모델이지만, 온톨로지 표준과의 정렬이 필요합니다.

### 2.3 실제 쿼리 시나리오 검증

**Use Case:** "이번 주 면접 예정인 지원자 중 리크루터가 미응답한 커뮤니케이션이 있는 경우"

**현재 온톨로지로 표현:**
```
Candidate -[CREATES]-> Application -[SCHEDULES]-> Interview
                                  |
                                  +-[ASSIGNS]-> Recruiter
                                  |
                                  +-[COMMUNICATES_WITH]-> Communication

조건:
- Interview.scheduled_date: this week
- Communication.response_time: null
- Communication.sender: Recruiter  ❌ 문제: sender가 'text' 타입
```

**Object Property 도입 후:**
```
Communication -[SENT_BY]-> Recruiter  ✅ 명확한 관계

쿼리 가능:
MATCH (c:Candidate)-[:CREATES]->(a:Application)-[:SCHEDULES]->(i:Interview)
MATCH (a)-[:COMMUNICATES_WITH]->(comm:Communication)-[:SENT_BY]->(r:Recruiter)
WHERE i.scheduled_date >= today()
  AND i.scheduled_date < today() + 7
  AND comm.response_time IS NULL
RETURN c
```

---

## 3. 개선 로드맵

### Phase 1: 타입 안전성 강화 (1-2주)

**목표:** TypeScript의 타입 시스템을 최대한 활용하여 컴파일 타임 안정성 확보

**작업 항목:**
- [ ] `ClassNodeData` / `PropertyNodeData` Union Type 분리 (Issue #1)
- [ ] 타입 가드 함수 구현 (`isClassNode`, `isPropertyNode`)
- [ ] 전체 코드베이스에 타입 가드 적용
- [ ] `type?` → `kind` 변경 (required 필드)
- [ ] 기존 테스트 코드 수정 및 타입 검증 테스트 추가

**주요 파일:**
- `src/types/ontology.ts`
- `src/stores/useOntologyStore.ts`
- `src/components/ClassNode.tsx`
- `src/components/GraphNode.tsx`
- `src/components/OntologyCanvas.tsx`

**예상 작업량:** 5-7일
**리스크:** 중간 (기존 코드 전면 수정)

---

### Phase 2: 전역 프로퍼티 풀 아키텍처 (2-3주)

**목표:** 프로퍼티 재사용 가능한 구조로 전환

**작업 항목:**
- [ ] `globalProperties` Map 구조 설계 (Issue #2)
- [ ] `classPropertyLinks` 관계 테이블 설계
- [ ] 기존 `initialNodes` 데이터 마이그레이션 스크립트 작성
- [ ] Schema View 렌더링 로직 수정 (classPropertyLinks 기반)
- [ ] Graph View 렌더링 로직 수정 (중복 노드 제거)
- [ ] 프로퍼티 추가/삭제/수정 UI 로직 전면 개편
- [ ] Zustand persist 마이그레이션 로직 추가

**마이그레이션 예시:**

```typescript
// Before
nodes: [
    {
        id: 'candidate',
        data: {
            properties: [
                { id: 'c1', name: 'name', type: 'text' },
                { id: 'c2', name: 'email', type: 'text' }
            ]
        }
    },
    {
        id: 'recruiter',
        data: {
            properties: [
                { id: 'r1', name: 'name', type: 'text' },
                { id: 'r2', name: 'email', type: 'text' }
            ]
        }
    }
]

// After
globalProperties: {
    'name': { id: 'name', name: 'name', type: 'text' },
    'email': { id: 'email', name: 'email', type: 'text' }
},
classPropertyLinks: [
    { classId: 'candidate', propertyId: 'name', required: true },
    { classId: 'candidate', propertyId: 'email', required: true },
    { classId: 'recruiter', propertyId: 'name', required: true },
    { classId: 'recruiter', propertyId: 'email', required: true }
]
```

**주요 파일:**
- `src/types/ontology.ts` (타입 정의)
- `src/stores/useOntologyStore.ts` (스토어 구조 전면 개편)
- `src/components/ClassNode.tsx` (프로퍼티 렌더링 로직)
- `src/components/OntologyCanvas.tsx` (뷰 전환 로직)

**예상 작업량:** 10-12일
**리스크:** 높음 (아키텍처 변경, 데이터 마이그레이션)

---

### Phase 3: Object Property 지원 (1-2주)

**목표:** 클래스 간 참조를 명시적으로 표현

**작업 항목:**
- [ ] `PropertyType` 확장 또는 Edge 규칙 명확화 (Issue #3)
- [ ] Edge에 `propertyName`, `cardinality` 메타데이터 추가
- [ ] Edge 기반 Object Property UI 구현
- [ ] 기존 initialNodes의 관계 검토 및 Object Property 전환
- [ ] 쿼리 시나리오 검증

**Edge 메타데이터 예시:**

```typescript
export interface OntologyEdgeData {
    label: string;

    // Object Property 메타데이터
    propertyName?: string;  // 프로그래밍 접근 시 사용할 이름
    cardinality?: '1:1' | '1:N' | 'N:1' | 'N:M';
    required?: boolean;

    // 기존
    description?: string;
}
```

**주요 파일:**
- `src/types/ontology.ts`
- `src/stores/useOntologyStore.ts` (Edge 관리 로직)
- `src/components/EdgeLabel.tsx` (신규 생성)

**예상 작업량:** 5-7일
**리스크:** 중간

---

### Phase 4: 양방향 변환 정보 보존 (1주)

**목표:** Schema ↔ Graph View 전환 시 데이터 무손실

**작업 항목:**
- [ ] `PropertyNodeData`에 `metadata` 필드 추가 (Issue #4)
- [ ] 변환 로직 수정 (정보 보존)
- [ ] Graph View에서 데이터 타입/required 시각화
- [ ] 툴팁에 상세 메타데이터 표시

**UI 개선:**

```typescript
// GraphNode에 프로퍼티 메타데이터 표시
<div className="flex items-center gap-1">
    <div className={cn(
        "w-4 h-4 rounded-full",
        getPropertyColor(data.metadata?.dataType)
    )} />
    <span className="font-semibold">{data.label}</span>
    {data.metadata?.required && (
        <span className="text-red-500 text-xs">*</span>
    )}
</div>

// 툴팁
<Tooltip.Content>
    <div className="space-y-1">
        <div className="font-semibold">{data.label}</div>
        <div className="text-xs">Type: {data.metadata?.dataType}</div>
        <div className="text-xs">Required: {data.metadata?.required ? 'Yes' : 'No'}</div>
        {data.description && (
            <div className="text-xs text-gray-400">{data.description}</div>
        )}
    </div>
</Tooltip.Content>
```

**주요 파일:**
- `src/types/ontology.ts`
- `src/stores/useOntologyStore.ts` (setViewMode)
- `src/components/GraphNode.tsx`

**예상 작업량:** 3-4일
**리스크:** 낮음

---

### Phase 5: 온톨로지 검증 레이어 (2-3주) - Optional

**목표:** 온톨로지 일관성 자동 검증

**작업 항목:**
- [ ] Cardinality 제약 검증 (1:1 관계가 실제로 지켜지는지)
- [ ] Disjoint class 검증 (상호 배타적 클래스)
- [ ] 순환 참조 감지
- [ ] 고아 노드 감지 (연결되지 않은 노드)
- [ ] OWL Reasoner 경량 버전 통합 (선택)

**검증 예시:**

```typescript
interface ValidationResult {
    isValid: boolean;
    errors: Array<{
        type: 'cardinality' | 'disjoint' | 'circular' | 'orphan';
        message: string;
        affectedNodes: string[];
    }>;
    warnings: Array<{
        message: string;
        suggestion: string;
    }>;
}

// 사용
const result = validateOntology(state.nodes, state.edges);
if (!result.isValid) {
    console.error('Ontology validation failed:', result.errors);
}
```

**주요 파일:**
- `src/lib/ontologyValidator.ts` (신규 생성)
- `src/stores/useOntologyStore.ts` (검증 훅 통합)

**예상 작업량:** 8-10일
**리스크:** 낮음 (선택적 기능)

---

## 4. Quick Wins (1주 내 적용 가능)

즉시 개선 가능한 항목들:

### Quick Win #1: 타입 명확화

```typescript
// src/types/ontology.ts
export interface OntologyNodeData {
    kind: 'class' | 'property';  // type → kind, required로 변경
    label: string;
    description?: string;
    // ... 나머지
}
```

**작업량:** 1-2시간
**효과:** 타입 안정성 향상, 코드 가독성 개선

---

### Quick Win #2: Graph View 프로퍼티 정보 보존

```typescript
// src/stores/useOntologyStore.ts:519
// Schema → Graph 변환 시
const propNode = {
    id: propNodeId,
    type: 'graphNode',
    data: {
        label: prop.name,
        type: 'property',
        description: prop.description,

        // 추가: 원본 정보 보존
        _metadata: {
            originalType: prop.type,
            originalRequired: prop.required,
            originalId: prop.id
        },

        properties: [],
        rules: []
    }
};
```

**작업량:** 1-2시간
**효과:** 정보 손실 방지

---

### Quick Win #3: UI 피드백 개선

```typescript
// src/components/GraphNode.tsx
import * as Tooltip from '@radix-ui/react-tooltip';

<Tooltip.Provider>
    <Tooltip.Root>
        <Tooltip.Trigger asChild>
            <div className="graph-node">
                {/* 기존 노드 렌더링 */}
            </div>
        </Tooltip.Trigger>
        <Tooltip.Content side="top" className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
            <div className="font-semibold">{data.label}</div>
            {data._metadata && (
                <>
                    <div>Type: {data._metadata.originalType}</div>
                    <div>Required: {data._metadata.originalRequired ? 'Yes' : 'No'}</div>
                </>
            )}
        </Tooltip.Content>
    </Tooltip.Root>
</Tooltip.Provider>
```

**작업량:** 2-3시간
**효과:** UX 개선, 정보 가시성 향상

---

## 5. 우선순위 권장사항

### Immediate (1-2주 내):
1. **타입 안전성 강화 (Phase 1)** - 가장 기본이 되는 개선
2. **Quick Wins 모두 적용** - 빠른 효과

### Short-term (1-2개월):
3. **Object Property 지원 (Phase 3)** - 실무 쿼리 시나리오에 필요
4. **양방향 변환 정보 보존 (Phase 4)** - UX 개선

### Long-term (3-6개월):
5. **전역 프로퍼티 풀 (Phase 2)** - 대규모 리팩토링, 충분한 시간 확보 필요
6. **온톨로지 검증 레이어 (Phase 5)** - 선택적, 안정화 후 추가

---

## 6. 기술 스택 권장사항

### 타입 검증 강화
```bash
npm install --save-dev @typescript-eslint/eslint-plugin
npm install --save-dev @typescript-eslint/parser
```

**ESLint 규칙 추가:**

```json
// .eslintrc.json
{
    "rules": {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/strict-boolean-expressions": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn"
    }
}
```

### 온톨로지 검증 (Phase 5)
```bash
npm install rdflib  # RDF 처리
npm install jsonld  # JSON-LD 변환
```

### 마이그레이션 도구 (Phase 2)
```bash
npm install --save-dev immer  # 불변성 유지하며 데이터 변환
```

---

## 7. 테스트 전략

### Unit Tests

```typescript
// src/types/ontology.test.ts
import { isClassNode, isPropertyNode } from './ontology';

describe('Type Guards', () => {
    test('isClassNode should identify class nodes', () => {
        const classNode: ClassNodeData = {
            kind: 'class',
            label: 'Candidate',
            properties: [],
            rules: []
        };
        expect(isClassNode(classNode)).toBe(true);
    });

    test('isPropertyNode should identify property nodes', () => {
        const propNode: PropertyNodeData = {
            kind: 'property',
            label: 'email',
            dataType: 'text',
            required: true
        };
        expect(isPropertyNode(propNode)).toBe(true);
    });
});
```

### Integration Tests

```typescript
// src/stores/useOntologyStore.test.ts
describe('View Mode Switching', () => {
    test('should preserve metadata when switching to Graph View', () => {
        const store = useOntologyStore.getState();

        // Schema View 상태
        const initialProperty = store.nodes[0].data.properties[0];
        expect(initialProperty.type).toBe('text');
        expect(initialProperty.required).toBe(true);

        // Graph View로 전환
        store.setViewMode('graph');

        // 메타데이터 보존 확인
        const graphPropertyNode = store.nodes.find(n => n.type === 'graphNode');
        expect(graphPropertyNode.data._metadata.originalType).toBe('text');
        expect(graphPropertyNode.data._metadata.originalRequired).toBe(true);
    });
});
```

---

## 8. 참고 자료

### 온톨로지 표준
- [OWL 2 Web Ontology Language Primer](https://www.w3.org/TR/owl2-primer/)
- [RDF Schema 1.1](https://www.w3.org/TR/rdf-schema/)
- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)

### Property Graph vs RDF
- [Property Graphs vs RDF: A Comparison](https://neo4j.com/blog/rdf-vs-property-graphs-knowledge-graphs/)
- [Labeled Property Graphs](https://neo4j.com/developer/graph-database/#labeled-property-graph)

### TypeScript Best Practices
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Type Guards and Differentiating Types](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

## 9. 연락처 및 피드백

**온톨로지 설계 관련 질문:**
- Forry (Ontology Design Specialist)

**개발 구현 관련 질문:**
- 개발팀 리드

**리뷰 문서 버전:** 1.0
**다음 리뷰 예정일:** 2025-12-24 (2주 후)

---

## Appendix: 용어 정리

| 용어 | 설명 | 예시 |
|------|------|------|
| **Class** | 온톨로지의 개념/엔티티 | Candidate, Job Posting |
| **Property** | 클래스의 속성 | email, name, phone |
| **Datatype Property** | 리터럴 값을 갖는 프로퍼티 | email: "test@example.com" |
| **Object Property** | 다른 클래스를 참조하는 프로퍼티 | assignedRecruiter → Recruiter 인스턴스 |
| **Domain** | 프로퍼티를 가질 수 있는 클래스 | email의 domain: Person |
| **Range** | 프로퍼티 값의 타입 | email의 range: string |
| **Cardinality** | 관계의 수량 제약 | 1:1, 1:N, N:M |
| **Disjoint Classes** | 상호 배타적인 클래스 | Candidate ⊥ Recruiter (동시 불가) |
| **Reasoning** | 온톨로지 규칙 기반 추론 | A는 B의 하위클래스 → A 인스턴스는 B |

---

**문서 끝**
