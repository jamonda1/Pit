PIT SVG V3 / USER REFERENCE IMAGE ALIGNED

Screenshot 1212 x 710px bounds:
P: x=78, y=58, width=521, height=618
i-dot: x=615, y=184, width=136, height=143
i-stem: x=521, y=343, width=208, height=336
t: x=739, y=143, width=378, height=545

Reference horizontal bounding-box gaps: P to i-dot 16 px, i-stem to t 10 px.
The i dot and stem were independently positioned.
SVG has real vector paths, not embedded raster images.
Position/bounds match screenshot, but internal contours of recreated letters differ from screenshot.

PIT 로고 — 손으로 재구성한 벡터 SVG 세트

기준: 사용자가 선택한 가이드북 심볼의 형태와 색상, 유리 질감
파일: 01~08은 버전별 마스터 SVG. elements/에는 P, i의 점, i 몸통, t, 앱 아이콘 배경이 각각 독립된 SVG.

모든 SVG는 PNG나 JPG를 내부에 넣지 않은 경로 기반의 독립 벡터입니다.
그라데이션, 클리핑, SVG 필터 등으로 유리 느낌을 재현했습니다.
다만 원본 AI 생성 가이드북 이미지와 픽셀 단위 동일한 복제는 아닙니다.
SVG 안 그룹의 id="element-P", "element-i-dot", "element-i-stem", "element-t"를 찾아 각각 편집할 수 있습니다.

특징:
- 01: 유리 글자만 / 배경 투명
- 02: 기본형 + 벡터 글자 태그라인
- 03: 다크 배경용 (실제 배경은 투명, 태그라인 밝음)
- 04: 앱 심볼형 (모서리 밖 투명, 내부 둥근 카드 포함)
- 05: 소형 평면형
- 06: 실버 모노크롬
- 07: 라인형
- 08: 큰 로고 + 태그라인
- elements/: 문자 및 아이콘 바탕의 독립 SVG

SVG의 흐림 효과는 앱마다 렌더링이 달라질 수 있습니다. Penpot 등에서 효과 일부가 차이나면 순수 경로와 그라데이션을 유지하는지 확인하세요.
편집 가능한 구성 요소 및 별도 파일을 제공합니다.

간격 수정 v2 (2026-10-30): 최초 가이드북의 P–i 간격을 더 가깝게 재현. 기존 글자 경로, 채색, 유리 반사광은 그대로 유지. P를 18유닛 왼쪽으로, i와 t를 14유닛 오른쪽으로 이동. 즉 P-i 사이 거리 +32유닛.
