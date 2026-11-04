# PIT frontend

React + TypeScript + Tailwind CSS + Vite 프론트엔드입니다.

```sh
npm install
npm run dev
npm run build
```

## 페이지 및 구조

- `/`: Penpot `01 · 랜딩` 기반 랜딩. CTA로 `/home` 이동.
- `/home`: Penpot `02 · 홈` 기반 홈. 새로고침과 브라우저 뒤로/앞으로 지원.
- `src/App.tsx`: 랜딩/홈/로딩 미리보기의 가벼운 History API 페이지 전환.
- `src/pages/LandingPage.tsx`, `landing.css`: 헤더, 히어로, Why PIT, 협업 작업 장면, 팀 슬라이드, 시작 방법, FAQ, 마지막 CTA.
- `src/components/landing/PresentationPreview.tsx`: CSS와 SVG로 구성한 편집 화면, 슬라이드, 그래프, 협업 커서.
- `src/pages/HomePage.tsx`, `home.css`: Home v2 워크스페이스 헤더, 소개 영역, 빠른 시작 4종, 최근 프레젠테이션, 검색·비율 선택·파일 선택.
- `src/components/Sidebar.tsx`: 기본 72px(모바일 60px)/확장 209px 전환. 홈·프레젠테이션·워크스페이스·템플릿·휴지통·설정 메뉴. 펼침 시 오버레이, Escape/바깥 클릭 닫기, 키보드 포커스 순환.
- `src/components/Wordmark.tsx`: 기존 유리 질감 가로 로고.
- `src/components/SlideBackground.tsx`: 기존 18개 배경 카드 및 레인 애니메이션 유지.

## 디자인과 에셋

Penpot PIT 파일 `64ee36db-f4d2-8047-8008-dc149baa5147`의 랜딩/홈 두 상태를 읽기 전용으로 확인했습니다.

2026-11-04 기준 랜딩은 `01 · 랜딩`의 최신 프레임 `cfe41f33-e5c8-801b-8008-e3df590b81f3` (PIT / Landing — Ideas become one · 1440)을 기준으로 합니다. 1440px에서 전체 높이 5760px, 섹션 시작 위치 960 / 1820 / 2940 / 3890 / 4670 / 5260px을 맞췄습니다. 화면이 좁아지면 콘텐츠 흐름에 따라 높이가 늘어납니다. 홈에는 `02 · 홈`의 최신 프레임 `5a62d546-3d04-802d-8008-e49b1e8b11c4` (Home v2 — Workspace first)를 적용했습니다. 1440px에서 사이드바 72px, 상단 바 82px, 소개 영역 (104, 107) / 1292×223px, 빠른 시작 카드 y=431, 최근 카드 y=677을 기준으로 합니다. Penpot의 기존 프레임은 수정하지 않았습니다.

`Logo/PIT_Liquid_Glass_Refined_v4/previews/`에서 다음 기존 PNG를 복사하여 제공합니다. 원본 Logo/는 수정하지 않았습니다.

- `01_mark_only_liquid_glass_1024.png`: 랜딩 로고, 접힌 사이드바 44×29px / 펼친 사이드바 134×89px
- `04_symbol_app_icon_1024.png`: 기존 앱 심볼과 favicon 보존

이전 확정 폰트 Pretendard Variable v1.3.9를 유지했습니다. Penpot의 Noto Sans KR/Inter Tight와 글자 폭은 다릅니다. 폰트 및 라이선스는 `public/fonts/pretendard/`에 있습니다.

## 동작 범위

- 사이드바 빠른 검색 또는 ⌘/Ctrl+K로 최근 프레젠테이션 검색을 엽니다. 예시 4개를 제목·소속 공간으로 필터링하며, Escape/닫기로 복구합니다.
- 새 프레젠테이션 버튼과 첫 빠른 시작 카드는 16:9 / 4:3 / 9:16 비율 선택 창을 엽니다. 선택 후 준비 안내를 표시합니다. 프레젠테이션 편집기는 포함하지 않습니다.
- PPTX는 로컬 파일 선택/확장자 확인까지만 지원하며 서버 업로드나 파싱은 하지 않습니다.
- 워크스페이스 선택 메뉴는 현재 개인 공간과 팀 공간 만들기 진입 항목을 표시합니다. 실제 공간 전환·생성은 아직 연결하지 않았습니다.
- 팀 공간 만들기·받은 초대·각 탐색 메뉴·설정·프로필·알림은 상태 안내만 제공합니다. 초대 2건과 최근 자료는 Penpot의 디자인 예시입니다.
- 정적 서버 배포 시 `/home` 직접 접근을 위해 index.html fallback을 설정해야 합니다.
- 별도 lint/test 스크립트는 아직 없습니다. `npm run build`는 TypeScript 검사와 Vite 빌드를 실행합니다.

## 콘텐츠 등장 애니메이션

랜딩은 `useCollaborativeBuild`의 협업 작업자 애니메이션을 유지합니다. 화면에 들어오는 섹션의 텍스트를 입력하고 도형을 배치하며, 완료된 CTA부터 활성화합니다. 애니메이션 건너뛰기, Tab 키 탐색, 화면 너비 변경 시 모든 콘텐츠와 CTA를 즉시 표시합니다. 시스템 모션 감소 설정에서는 처음부터 완성 화면을 표시합니다.

홈은 React Bits의 AnimatedContent와 GSAP/ScrollTrigger로 카드가 한 번씩 나타납니다. 기존 Magnet, SlideBackground 구성요소와 에셋은 보존했습니다. React Bits 라이선스는 `public/licenses/react-bits-LICENSE.md`에 포함했습니다. 펼친 사이드바는 바깥 클릭/Escape로 닫으며, 열고 닫을 때 버튼으로 포커스를 옮깁니다.

## 배포 및 확인

- Node.js 22, `npm ci`, `npm run build`는 기존 GitHub Actions 구성과 같습니다.
- Vercel 프로젝트의 Root Directory는 `frontend`, 빌드 명령은 `npm run build`, 결과 폴더는 `dist`입니다. 대시보드의 실제 연결 값은 별도 확인이 필요합니다.
- 기존 `vercel.json`의 SPA rewrite를 유지합니다. `/home`, `/loading-preview` 직접 접근 시에도 `index.html`로 연결해야 합니다.
- 랜딩과 홈의 장식/섹션 제목 클래스는 분리해 서로의 스타일이 영향을 주지 않도록 했습니다.
- 반응형 검증 너비: 320, 390, 768, 1024, 1440, 1920px. 메뉴 3개 유지, 가로 넘침 없음. CTA → 홈, 홈 새로고침, 브라우저 뒤로 가기, 메뉴 앵커, 키보드 탐색, 애니메이션 건너뛰기를 확인합니다.
- 홈도 320 / 390 / 520 / 768 / 1024 / 1280 / 1440 / 1920px에서 확인합니다. 빠른 시작·최근 카드는 화면 너비에 따라 4열 → 2열 → 1열로 배치합니다. 사이드바·워크스페이스 메뉴·비율 선택 창의 Escape 처리, 검색·빈 결과, PPTX/잘못된 확장자 선택을 확인합니다.


## PitLoading

`/loading-preview`에서 중앙 애니메이션, 크기 변경, 재생/일시 정지를 확인합니다.

```jsx
import PitLoading from './components/PitLoading'

// 비동기 작업의 실제 로딩 상태에 연결합니다.
return isLoading ? <PitLoading size={180} label="프레젠테이션을 불러오는 중" /> : <Content />
```

- `size`: 너비(px 숫자 또는 CSS 길이), 기본 180. 높이는 원본 540:357 비율입니다. 이미지 자체의 투명 여백도 유지합니다.
- `speed`: 기본 1에서 왕복 2666.67ms, 2에서 두 배속입니다.
- `paused`: 기본 false. 정지 시 현재 형태를 유지하며, 재생 시 그 위치부터 이어갑니다.
- `label`, `className`, `style`, `onError`: 접근성 이름, 외형, 이미지 로드 오류 처리를 지정합니다.
- 시스템 모션 감소 설정에서는 완성 로고를 정지 표시하며 설정 변경을 반영합니다.
- 언마운트 시 프레임 요청과 이벤트를 정리합니다. 여러 인스턴스는 독립적으로 동작합니다.

실제 원본은 루트 `assets/loading_motion.html`에 있으며 변경하지 않습니다. `src/assets/animations/`의 WebP 두 개는 원본 내장 데이터를 그대로 추출했습니다. `pitMotion.js`는 57프레임, 44–48 보정, 보간/타이밍 곡선, 조명/흐름 효과를 유지합니다. 미리보기 배경과 컨트롤은 컴포넌트에 포함하지 않습니다. JSX 컴포넌트는 TypeScript 사용을 위한 `PitLoading.d.ts`와 함께 제공합니다.
