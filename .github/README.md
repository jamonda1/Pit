# PIT CI/CD

## Frontend

### CI · GitHub Actions

설정: [`workflows/frontend-ci.yml`](./workflows/frontend-ci.yml)

- **실행 조건:** `develop`, `main` push 또는 해당 브랜치 대상 PR 생성·재열기·커밋 추가
- **환경:** Ubuntu, Node.js 22 / 작업 위치: `frontend/`
- **실행 순서:** 코드 체크아웃 → Node.js 설정 → `npm ci` → `npm run build`
- **검증 범위:** TypeScript 검사 및 Vite 프로덕션 빌드. 별도 테스트·배포 단계 없음.
- **결과 확인:** GitHub Actions → Frontend CI 또는 PR Checks

### CD · Vercel

- Git 연동 활성화 시 GitHub Actions와 별도로 빌드·배포 수행.
- 기본 동작: Vercel 빌드 성공 후 Preview 배포 또는 Production 반영.
- **GitHub Actions 성공까지 대기:** Vercel `Deployment Checks`에 해당 검사를 필수로 등록한 경우에만 Production 반영 대기.
- GitHub 필수 상태 검사: PR 병합 조건. Vercel의 운영 반영 조건과 별도 설정.
- **PIT 설정 확인 필요:** Vercel Git 연동, 운영 브랜치, Deployment Checks 등록 여부. 현재 대시보드 로그인 필요로 확인 불가.
- [`frontend/vercel.json`](../frontend/vercel.json): 화면 경로를 `/index.html`로 연결하는 SPA 설정. CI 성공 대기 설정 없음.

참고: [Vercel Git 연동](https://vercel.com/docs/git/vercel-for-github), [Deployment Checks](https://vercel.com/docs/deployment-checks)

## Backend

미구성. 백엔드 구축 후 CI/CD 추가 예정.
