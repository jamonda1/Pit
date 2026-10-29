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
- `src/App.tsx`: 기존 랜딩 및 가벼운 History API 페이지 전환.
- `src/pages/HomePage.tsx`, `home.css`: 검색, 생성 카드, 파일 선택, 최근 작업.
- `src/components/Sidebar.tsx`: React 상태로 64px/232px 전환. 펼침 시 오버레이, Escape/바깥 클릭 닫기, 키보드 포커스 순환.
- `src/components/Wordmark.tsx`: 기존 유리 질감 가로 로고.
- `src/components/SlideBackground.tsx`: 기존 18개 배경 카드 및 레인 애니메이션 유지.

## 디자인과 에셋

Penpot PIT 파일 `64ee36db-f4d2-8047-8008-dc149baa5147`의 랜딩/홈 두 상태를 읽기 전용으로 확인했습니다.

`Logo/PIT_Liquid_Glass_Refined_v4/previews/`에서 다음 기존 PNG를 복사하여 제공합니다. 원본 Logo/는 수정하지 않았습니다.

- `01_mark_only_liquid_glass_1024.png`: 랜딩 109×72px, 펼친 사이드바 149×98.47px
- `04_symbol_app_icon_1024.png`: 접힌 사이드바 44×44px

이전 확정 폰트 Pretendard Variable v1.3.9를 유지했습니다. Penpot의 Noto Sans KR/Inter Tight와 글자 폭은 다릅니다. 폰트 및 라이선스는 `public/fonts/pretendard/`에 있습니다.

## 동작 범위

- 검색 입력은 디자인 예시의 최근 작업 4개를 필터링합니다. ⌘/Ctrl+K로 검색창에 포커스합니다.
- 생성 카드와 최근 작업은 기능 준비 안내를 표시합니다. 프레젠테이션 편집기는 포함하지 않습니다.
- PPTX는 로컬 파일 선택/확장자 확인까지만 지원하며 서버 업로드나 파싱은 하지 않습니다.
- 프로젝트/템플릿/설정/프로필/알림은 상태 안내만 제공합니다.
- 정적 서버 배포 시 `/home` 직접 접근을 위해 index.html fallback을 설정해야 합니다.
- 별도 lint/test 스크립트는 아직 없습니다. `npm run build`는 TypeScript 검사와 Vite 빌드를 실행합니다.

## 콘텐츠 등장 애니메이션

React Bits의 AnimatedContent (TypeScript/Tailwind) 컴포넌트와 GSAP/ScrollTrigger를 사용합니다. 랜딩은 진입 시 문구→설명→CTA 순서로, 홈은 화면에 들어오는 카드별로 한 번씩 위로 이동하며 나타납니다. 기존 사이드바 전환은 유지합니다. 모션 감소 설정 시 콘텐츠는 바로 표시됩니다. React Bits 라이선스는 `public/licenses/react-bits-LICENSE.md`에 포함했습니다.

랜딩 CTA에는 React Bits Magnet을 적용했습니다(반응 범위 150px, 이동 제한 12px, damping 20, tilt 7, scale 1.1). 터치/정밀 포인터 미지원 및 모션 감소 환경에서는 비활성화됩니다. 펼친 사이드바에는 접기 버튼이 없으며 바깥 클릭/Escape로 닫습니다. 펼치기 시 로고 버튼, 닫기 시 펼치기 버튼으로 포커스를 옮깁니다.
