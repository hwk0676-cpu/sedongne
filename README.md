# 세동네

우리가 직접 가본 서울의 맛집 — Figma 디자인을 기준으로 만든 모바일 웹앱입니다.

- 홈 · 검색 · 지도(카테고리/음식유형/날씨) · 예약 · 웨이팅 확인 · 찜 리스트 · 마이페이지
- 빌드 없이 `index.html`을 열면 실행됩니다 (순수 HTML/CSS/JavaScript).
- 찜·예약·프로필은 브라우저(localStorage)에 저장되는 예시 데이터입니다.

## 구성
- `index.html` — 앱 뼈대
- `css/app.css` — Figma 측정값 기준 스타일 (메인 컬러 `#FF4E4E`)
- `js/data.js` — 맛집·찜 리스트·공지 등 샘플 데이터
- `js/app.js` — 화면 라우팅, 각 화면, 제스처·애니메이션
- `images/ui/` — 디자이너 제공 로고·아이콘·일러스트
- `images/` — 매장 사진 (출처는 `images/CREDITS.md`)

지도는 OpenStreetMap(Leaflet), 날씨는 Open-Meteo를 사용합니다.
