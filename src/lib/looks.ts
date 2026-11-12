// 성별과 연령대에 맞춘 코디 예시. 사진은 모두 Unsplash 라이선스(무료 상업 이용)이고, 파일로 저장하지 않고 Unsplash 주소를 불러온다.
// 사진 속 사람의 나이는 알 수 없어서 연령대는 옷 스타일로 추정한 분류다.
// 색 칩은 사진 속 옷 색에 가깝게 눈으로 맞춘 값이며, 보이지 않는 부분(하의 등)은 분위기 색으로 채웠다.
export type Gender = "여성" | "남성";
export type Age = "10~20대" | "30대 이상";
export type Photo = { src: string; alt: string; credit: string; creditUrl: string };
export type Look = { gender: Gender; age: Age; mood: string; top: string; bottom: string; desc: string; photo?: Photo };

export const GENDERS: Gender[] = ["여성", "남성"];
export const AGES: Age[] = ["10~20대", "30대 이상"];

// [분위기, 상의 색, 하의 색, 설명, 사진(이미지 id, 촬영자, 사진 페이지 id)]
type Row = [string, string, string, string, [string, string, string]?];

const group = (gender: Gender, age: Age, rows: Row[]): Look[] =>
  rows.map(([mood, top, bottom, desc, p]) => ({
    gender,
    age,
    mood,
    top,
    bottom,
    desc,
    photo: p && {
      src: `https://images.unsplash.com/photo-${p[0]}?w=640&q=70&auto=format&fit=crop`,
      alt: `${desc} 코디 사진`,
      credit: `Photo by ${p[1]} / Unsplash`,
      creditUrl: `https://unsplash.com/photos/${p[2]}`,
    },
  }));

export const LOOKS: Look[] = [
  ...group("여성", "10~20대", [
    ["차분한 미니멀", "#1A1A1A", "#3D4148", "블랙 재킷 + 블랙 팬츠 + 흰 스니커즈", ["1590330297626-d7aff25a0431", "Mike Von", "2UTk-Nip5aM"]],
    ["따뜻한 빈티지", "#EFE6D2", "#3D4148", "아이보리 레이스 블라우스", ["1506152983158-b4a74a01c721", "Lance Reis", "IwVRO3TLjLc"]],
    ["발랄한 Y2K", "#FF9AC8", "#FF4DA6", "핑크 코르셋 원피스", ["1609533896512-68e72be46a33", "Vladimir Yelizarov", "S47-OMYAql8"]],
    ["시원한 데님", "#F5F5F2", "#4A6A94", "흰 탱크톱 + 청바지", ["1592595293637-8557fa6d3c64", "Jennifer Marquez", "60VYe8pVah8"]],
    ["깊은 가을", "#A57C52", "#8A8460", "카멜 코트 + 올리브 니트", ["1618333452884-5c8d211ed2ad", "The AW Creative Digital Marketing", "DsKcWDk6NEU"]],
  ]),
  ...group("여성", "30대 이상", [
    ["차분한 미니멀", "#1A1A1A", "#3D4148", "검정 재킷 + 검정 바지", ["1614786269829-d24616faf56d", "Olga Zhuravleva", "A3MleA0jtoE"]],
    ["따뜻한 빈티지", "#4A6A94", "#6E1F2E", "블루 원피스 + 빨간 모자", ["1693748159946-a8ea64522dd2", "Farzin Yarahmadi", "TNkLWg2s3Fw"]],
    ["발랄한 Y2K", "#EFE6D2", "#F5F5F2", "크림 블라우스 + 흰 팬츠", ["1603344797033-f0f4f587ab60", "engin akyurt", "jaZoffxg1yc"]],
    ["시원한 데님", "#F5F5F2", "#4A6A94", "흰 티 + 청바지", ["1475178626620-a4d074967452", "Karolina Grabowska", "zDyJOj8ZXG0"]],
    ["깊은 가을", "#6E1F2E", "#1C1B19", "버건디 스웨터", ["1543081681-e12b7d01e0cd", "Roberts Pelitis", "BNzSw09rAqk"]],
  ]),
  ...group("남성", "10~20대", [
    ["차분한 미니멀", "#F5F5F2", "#1A1A1A", "흰 폴로 + 블랙 팬츠", ["1614890085618-0e1054da74f8", "Mohamad Khosravi", "qC7jvmbEmRQ"]],
    ["따뜻한 빈티지", "#EFE6D2", "#8A8460", "아이보리 린넨 셔츠 + 어두운 바지", ["1627686011747-74adda3d2343", "Santhosh Vaithiyanathan", "D_Y-BuWJvjw"]],
    ["발랄한 Y2K", "#FFE066", "#1A1A1A", "노란 티셔츠 + 블랙 데님", ["1605949405965-d49ada3f9189", "behrouz sasani", "cEnSr1WRHUY"]],
    ["시원한 데님", "#1A1A1A", "#4A6A94", "블랙 티셔츠 + 청바지", ["1622519407650-3df9883f76a5", "behrouz sasani", "6OGml3UomZw"]],
    ["깊은 가을", "#6B4A32", "#4A6A94", "브라운 집업 + 청바지", ["1620228922597-cca58f177310", "Mohamad Khosravi", "DuY4JP2M34Q"]],
  ]),
  ...group("남성", "30대 이상", [
    ["차분한 미니멀", "#9DB7D5", "#1F2A44", "파란 셔츠 + 네이비 슬랙스", ["1624835567150-0c530a20d8cc", "Mohamad Khosravi", "OSS7Gd9whn8"]],
    ["따뜻한 빈티지", "#A57C52", "#4A6A94", "스웨이드 재킷 + 흰 티셔츠", ["1776843370483-4f793bc14739", "Long Chung", "Gc5Rpu9186o"]],
    ["발랄한 Y2K", "#6FA3C8", "#3D4148", "청색 셔츠", ["1589310243389-96a5483213a8", "Roman Holoschchuk", "nFhRxa64fvM"]],
    ["시원한 데님", "#8A8460", "#1F2A44", "리넨 셔츠 + 카키 블레이저 + 청바지(펼쳐 놓은 사진)", ["1593030761757-71fae45fa0e7", "Benjamin R.", "ItqFmSxKnIg"]],
    ["깊은 가을", "#D6C3A1", "#F5F5F2", "흰 티셔츠 + 탄 재킷", ["1787044797835-0901dbd3d0aa", "Sage Atlas", "PyAsyRVZvVQ"]],
  ]),
];

// 고른 성별과 연령대에 맞는 코디. 고르지 않은 쪽은 모두 보여 준다.
export const pickLooks = (gender: Gender | "", age: Age | "") =>
  LOOKS.filter((l) => (!gender || l.gender === gender) && (!age || l.age === age));
