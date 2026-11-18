import { Bagel_Fat_One, Black_And_White_Picture, Black_Han_Sans, Gowun_Batang, Gowun_Dodum, Jua, Orbit, Song_Myung } from "next/font/google";
import localFont from "next/font/local";
import { cx } from "@/lib/format";

/*
 * 포스터 제목 글꼴 (src/lib/title-fonts.ts의 키와 짝). 한글 글꼴이라 미리 받지 않고(preload: false),
 * 화면에 실제로 쓰인 글자 범위만 브라우저가 받아 간다. (next/font 옵션은 글자 그대로 적어야 해서 반복한다)
 */
const watermelonSalad = localFont({ src: "./fonts/EF_watermelonSalad.woff", variable: "--font-t-watermelon-salad", display: "swap", preload: false });
const orbit = Orbit({ weight: "400", variable: "--font-t-orbit", display: "swap", preload: false });
const jua = Jua({ weight: "400", variable: "--font-t-jua", display: "swap", preload: false });
const songMyung = Song_Myung({ weight: "400", variable: "--font-t-song-myung", display: "swap" }); // 서브셋이 없어 원래 미리 받지 않는다
const bagelFatOne = Bagel_Fat_One({ weight: "400", variable: "--font-t-bagel-fat-one", display: "swap", preload: false });
const gowunDodum = Gowun_Dodum({ weight: "400", variable: "--font-t-gowun-dodum", display: "swap", preload: false });
const gowunBatang = Gowun_Batang({ weight: "700", variable: "--font-t-gowun-batang", display: "swap", preload: false });
const blackHanSans = Black_Han_Sans({ weight: "400", variable: "--font-t-black-han-sans", display: "swap", preload: false });
const blackAndWhitePicture = Black_And_White_Picture({ weight: "400", variable: "--font-t-black-and-white-picture", display: "swap", preload: false });

export const titleFontVariables = cx(
  watermelonSalad.variable, orbit.variable, jua.variable, songMyung.variable, bagelFatOne.variable,
  gowunDodum.variable, gowunBatang.variable, blackHanSans.variable, blackAndWhitePicture.variable,
);
