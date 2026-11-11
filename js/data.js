/* 세동네 sample data. Replace with a real API later. */
window.SD_DATA = (() => {
  const CATS = {
    korean: { label: '한식', color: '#FF4E4E' },
    world: { label: '세계요리', color: '#4E5BF0' },
    cafe: { label: '디저트·카페', color: '#B9852F' },
  };

  const TYPES = [
    { key: '고기류', color: '#FF4E4E' },
    { key: '면류', color: '#B07A30' },
    { key: '밥류', color: '#4E7D3A' },
    { key: '국·탕·찌개류', color: '#E07B2E' },
    { key: '해산물류', color: '#4E5BF0' },
    { key: '분식류', color: '#C2427A' },
    { key: '양식류', color: '#6B4FA0' },
    { key: '디저트류', color: '#A8507A' },
    { key: '커피류', color: '#5A3A2E' },
  ];

  // lat/lng are around 논현역 so they show on the map.
  const RESTAURANTS = [
    { id: 'r1', imgs: ['images/r1-ributjip.jpg'], name: '리북집 논현본점', cat: 'korean', type: '고기류', area: '강남 논현', area2: '논현', rating: 4.7, reviews: 312, open: '00:00', desc: '새콤달콤 쟁반국수와 족발의 조합', emoji: '🍖', hue: 18, lat: 37.5118, lng: 127.0222, phone: '02-512-1234', address: '서울 강남구 학동로 112', menu: [['족발 (대)', 42000], ['생반국수', 9000], ['보쌈 정식', 13000]], waitTeams: 4, waitMin: 15 },
    { id: 'r2', imgs: ['images/r2-dongho.jpg'], name: '동호숯불바베큐', cat: 'world', type: '고기류', area: '강남 논현', area2: '논현', rating: 4.5, reviews: 204, open: '22:45', desc: '후라이드의 바삭함 속에 숨은 비밀', emoji: '🍗', hue: 28, lat: 37.5098, lng: 127.0235, phone: '02-545-5678', address: '서울 강남구 논현로 151길 8', menu: [['숯불 바베큐 플래터', 38000], ['버팔로 윙', 18000]], waitTeams: 2, waitMin: 10 },
    { id: 'r3', imgs: ['images/r3-gourmet.jpg'], name: '구르메스시', cat: 'world', type: '해산물류', area: '강남 신사', area2: '신사', rating: 4.6, reviews: 158, open: '22:45', desc: '쉐프님의 손맛이 느껴지는 스시 한 점', emoji: '🍣', hue: 200, lat: 37.5131, lng: 127.0198, phone: '02-543-0909', address: '서울 강남구 도산대로 15길 3', menu: [['런치 오마카세', 55000], ['디너 오마카세', 110000]], waitTeams: 0, waitMin: 0 },
    { id: 'r4', imgs: ['images/r4-hikari.jpg'], name: '히까리', cat: 'world', type: '고기류', area: '강남 논현', area2: '논현', rating: 4.8, reviews: 421, open: '00:00', desc: '알찬 구성으로 즐기는 오마카세', emoji: '🥩', hue: 8, lat: 37.5105, lng: 127.0205, phone: '02-3445-1001', address: '서울 강남구 강남대로 128길 20', menu: [['규카츠 정식', 19000], ['히레카츠', 16000]], waitTeams: 6, waitMin: 22 },
    { id: 'r5', imgs: ['images/r5-hadonggwan.jpg'], name: '하동관', cat: 'korean', type: '국·탕·찌개류', area: '중구 명동', area2: '명동', rating: 4.8, reviews: 1290, open: '16:00', desc: '1939년부터 이어온 맑은 곰탕', emoji: '🍲', hue: 40, lat: 37.5122, lng: 127.0248, phone: '02-776-5656', address: '서울 중구 명동9길 12', menu: [['곰탕', 17000], ['수육', 40000]], waitTeams: 9, waitMin: 30, popular: true, menuLabel: '한우 곰탕' },
    { id: 'r6', imgs: ['images/r6-jinjuhoegwan.jpg'], name: '진주회관', cat: 'korean', type: '면류', area: '중구 시청', area2: '시청', rating: 4.5, reviews: 980, open: '20:00', desc: '진하고 고소한 여름 콩국수', emoji: '🍜', hue: 52, lat: 37.5089, lng: 127.0212, phone: '02-753-5388', address: '서울 중구 세종대로 11길 26', menu: [['콩국수', 15000], ['김치볶음밥', 9000]], waitTeams: 5, waitMin: 18, popular: true, menuLabel: '콩국수' },
    { id: 'r7', imgs: ['images/r7-eulmildae.jpg'], name: '을밀대 본점', cat: 'korean', type: '면류', area: '마포 염리', area2: '마포', rating: 4.6, reviews: 1104, open: '21:30', desc: '시원한 육수의 평양냉면', emoji: '🥢', hue: 190, lat: 37.5137, lng: 127.0230, phone: '02-717-1922', address: '서울 마포구 숭문길 24', menu: [['물냉면', 16000], ['녹두전', 14000]], waitTeams: 11, waitMin: 35, popular: true, menuLabel: '평양냉면' },
    { id: 'r8', imgs: ['images/col-date.jpg', 'images/r8-bossam.jpg'], name: '각시보쌈 합정본점', cat: 'korean', type: '고기류', area: '마포 합정', area2: '합정', rating: 4.5, reviews: 640, open: '23:00', desc: '합정에서 찾는 정통 보쌈 맛집', emoji: '🥬', hue: 120, lat: 37.5092, lng: 127.0189, phone: '02-338-4321', address: '서울 마포구 양화로 6길 9', menu: [['보쌈 (중)', 35000], ['막국수', 9000]], waitTeams: 7, waitMin: 25 },
    { id: 'r9', imgs: ['images/r9-galbi.jpg'], name: '해남갈비', cat: 'korean', type: '고기류', area: '종로 익선', area2: '익선', rating: 4.4, reviews: 230, open: '22:00', desc: '숯불 향 가득한 돼지갈비', emoji: '🔥', hue: 12, lat: 37.5113, lng: 127.0264, phone: '02-765-2020', address: '서울 종로구 수표로 28길 17', menu: [['돼지갈비', 17000], ['된장찌개', 7000]], waitTeams: 3, waitMin: 12 },
    { id: 'r10', imgs: ['images/r10-jeyuk.jpg'], name: '청진식당', cat: 'korean', type: '밥류', area: '종로 청진', area2: '종로', rating: 4.3, reviews: 188, open: '21:00', desc: '정갈한 백반과 제육볶음', emoji: '🍚', hue: 34, lat: 37.5079, lng: 127.0226, phone: '02-735-1188', address: '서울 종로구 종로3길 17', menu: [['제육 백반', 11000], ['김치찌개', 9000]], waitTeams: 1, waitMin: 5 },
    { id: 'r11', imgs: ['images/col-lunch.jpg', 'images/r11-baekban.jpg'], name: '능라밥상', cat: 'korean', type: '밥류', area: '종로 관철', area2: '종로', rating: 4.4, reviews: 97, open: '20:30', desc: '제철 반찬이 가득한 집밥', emoji: '🍱', hue: 95, lat: 37.5145, lng: 127.0207, phone: '02-2267-7700', address: '서울 종로구 종로12길 5', menu: [['오늘의 밥상', 12000]], waitTeams: 2, waitMin: 8 },
    { id: 'r12', imgs: ['images/r12-alaprima-1.jpg', 'images/r12-alaprima-2.jpg', 'images/r12-alaprima-3.jpg', 'images/r12-alaprima-4.jpg'], name: '알라프리마', cat: 'world', type: '양식류', area: '강남 청담', area2: '청담', cuisine: '컨템포러리 다이닝', rating: 4.6, reviews: 210, open: '22:00', desc: '계절을 담은 컨템포러리 다이닝', emoji: '🍽️', hue: 330, lat: 37.5126, lng: 127.0179, phone: '02-511-2555', address: '서울 강남구 학동로 17길 13', menu: [['디너 코스', 240000]], waitTeams: 0, waitMin: 0 },
    { id: 'r13', imgs: ['images/r13-lespoir-1.jpg', 'images/r13-lespoir-2.jpg', 'images/r13-lespoir-3.jpg', 'images/r13-lespoir-4.jpg'], name: '레스쁘아 뒤 이브', cat: 'world', type: '양식류', area: '강남 신사', area2: '신사', cuisine: '프렌치', rating: 4.5, reviews: 186, open: '22:00', desc: '정통 프렌치 비스트로', emoji: '🥖', hue: 45, lat: 37.5085, lng: 127.0252, phone: '02-517-6034', address: '서울 강남구 도산대로 45길 10', menu: [['오리 콩피', 42000], ['양파 수프', 16000]], waitTeams: 1, waitMin: 6 },
    { id: 'r14', imgs: ['images/r14-coffee.jpg'], name: '논현 브루잉', cat: 'cafe', type: '커피류', area: '강남 논현', area2: '논현', rating: 4.6, reviews: 340, open: '22:00', desc: '직접 로스팅한 스페셜티 커피', emoji: '☕', hue: 30, lat: 37.5101, lng: 127.0258, phone: '02-512-7788', address: '서울 강남구 논현로 149길 32', menu: [['핸드드립', 7000], ['바스크 치즈케이크', 8500]], waitTeams: 0, waitMin: 0 },
    { id: 'r15', imgs: ['images/r15-saltbread.jpg'], name: '소금빵 공방', cat: 'cafe', type: '디저트류', area: '강남 논현', area2: '논현', rating: 4.7, reviews: 512, open: '20:00', desc: '매일 아침 굽는 소금빵', emoji: '🥐', hue: 38, lat: 37.5133, lng: 127.0254, phone: '02-3446-1212', address: '서울 강남구 학동로 2길 21', menu: [['소금빵', 3500], ['라떼', 5500]], waitTeams: 3, waitMin: 10 },
    { id: 'r16', imgs: ['images/r16-gelato.jpg'], name: '모퉁이 젤라또', cat: 'cafe', type: '디저트류', area: '강남 신사', area2: '신사', rating: 4.5, reviews: 211, open: '22:30', desc: '제철 과일로 만든 젤라또', emoji: '🍨', hue: 340, lat: 37.5083, lng: 127.0199, phone: '02-545-3030', address: '서울 강남구 압구정로 10길 11', menu: [['컵 젤라또 (2가지)', 6500]], waitTeams: 0, waitMin: 0 },
  ];

  const COLLECTIONS = [
    { id: 'c1', name: '데이트 맛집 모음', cover: 'images/col-date.jpg', collage: ['images/date-1.jpg', 'images/date-2.jpg', 'images/date-3.jpg', 'images/date-4.jpg'], ids: ['r12', 'r13', 'r3', 'r4', 'r16'], pinned: true, public: false },
    { id: 'c2', name: '분위기 좋은 카페', cover: 'images/col-cafe.jpg', ids: ['r14', 'r15', 'r16'], pinned: false, public: true },
    { id: 'c3', name: '회사 근처 점심 맛집', cover: 'images/col-lunch.jpg', ids: ['r1', 'r10', 'r11', 'r6', 'r9', 'r2', 'r8'], pinned: false, public: false },
  ];

  const NOTICES = [
    { tag: '공지', date: '2026.07.21', title: '[ 안내 ] 서비스 장애 전담센터 운영 안내', body: '서비스 이용 중 불편을 겪으신 경우 장애 전담센터(평일 10:00~18:00)로 문의해 주세요. 빠르게 확인해 도와드릴게요.' },
    { tag: '공지', date: '2026.07.21', title: '[ 안내 ] 신규 서비스 안내', body: '이제 세동네에서 매장의 실시간 웨이팅을 확인할 수 있어요. 예약 탭의 웨이팅 확인에서 이용해 보세요.' },
    { tag: '공지', date: '2026.07.21', title: '[ 안내 ] 세동네 업데이트 안내', body: '지도에서 카테고리와 음식 유형으로 맛집을 걸러볼 수 있도록 개선했어요.' },
  ];

  const FAQ = [
    { group: '찜 목록', items: [
      ['찜 해놓으면 목록이 자동으로 생기나요?', '하트를 누르면 기본 목록에 담기고, 찜 탭에서 새 리스트를 만들어 나눠 담을 수 있어요.'],
      ['찜 목록 변경은 어떻게 하나요?', '찜 탭 > 전체보기 > 편집에서 리스트를 고정하거나 삭제할 수 있어요.'],
      ['찜 목록을 지인과 공유할 수 있나요?', '리스트 상세의 ‘공유’ 버튼으로 링크를 보낼 수 있어요.'],
    ]},
    { group: '위치', items: [
      ['위치를 변경하고 싶으면 어떻게 해야 되나요?', '지도 화면에서 지도를 움직인 뒤 ‘현재 지도 중심’ 기준으로 다시 검색할 수 있어요.'],
      ['위치와 관련된 개인 정보는 어떻게 보호 되나요?', '위치 정보는 주변 맛집을 보여줄 때만 사용하고 서버에 저장하지 않아요.'],
      ['주소를 여러개 입력할 수 있나요?', '현재는 활동지역 한 곳만 입력할 수 있어요. 여러 주소 등록은 준비 중이에요.'],
    ]},
    { group: '예약', items: [
      ['예약 당일 취소도 가능한가요?', '방문 3시간 전까지 앱에서 직접 취소할 수 있어요. 이후에는 매장으로 연락해 주세요.'],
      ['예약금이 따로 있나요?', '세동네 예약은 별도의 예약금이 없어요. 일부 매장은 매장 정책에 따라 달라질 수 있어요.'],
    ]},
  ];

  const SUPPORT = ['AI에 입력한 내용을 초기화 할 수 있나요?', '맛집 리스트의 출처는 어디인가요?', '주소를 잘못 기입했어요. 주소를 변경하고 싶어요.'];

  const WAIT_RECENT = ['상수 미식관', '연남동 연록'];

  const RECOMMENDED = ['파스타', '리조또', '스테이크', '브런치', '피자', '와인', '데이트 맛집'];

  return { WAIT_RECENT, CATS, TYPES, RESTAURANTS, COLLECTIONS, NOTICES, FAQ, SUPPORT, RECOMMENDED, VERIFIED_COUNT: 5146 };
})();
