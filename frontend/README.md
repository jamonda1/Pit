# PIT frontend

Penpot `PIT / 01 · 랜딩`을 옮긴 단일 React + TypeScript + Tailwind CSS 랜딩 페이지입니다.

```sh
npm install
npm run dev
npm run build
```

- `src/components/Wordmark.tsx`: 임시 단순 워드마크
- `src/components/SlideBackground.tsx`: 18개 원본 슬라이드, 레인별 6개. 무한 반복을 위한 동일한 복제 세트 포함.
- 세 레인은 90 / 115 / 100초 주기이며 중간 레인은 반대 방향으로 이동합니다.
- 가장자리 마스크, 배경 일시 정지 버튼, `prefers-reduced-motion` 지원.
- CTA는 현재 화면에서 준비 중 안내를 표시합니다. 제품 진입 경로가 정해지면 연결하세요.
- 다른 페이지, 업로드 기능, 공동 편집 기능, 백엔드는 구현하지 않았습니다.
- 원본 Penpot 파일은 변경하지 않았습니다.

## 대표 폰트

Pretendard Variable v1.3.9를 로컬에서 제공합니다. 제목 650, 본문 400, CTA 600, 보조 안내 500을 사용합니다. 폰트와 SIL Open Font License는 `public/fonts/pretendard/`에 포함되어 있습니다.
