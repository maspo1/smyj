# 💍 성민 & 연정의 결혼식 (Sungmin & Yeonjeong's Wedding)

<p align="center">
  <img src="https://img.shields.io/badge/wedding-ceremony-E91E63?style=for-the-badge&logo=heart" alt="Wedding Badge">
  <img src="https://img.shields.io/badge/Deploy-Automated-2088ff?style=for-the-badge&logo=githubactions&logoColor=white" alt="Build Status">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License Badge">
</p>

🇰🇷 저희의 결혼식 모바일 청첩장 및 정보 공유 웹사이트를 위한 저장소입니다. 소중한 날의 예식 일정, 하객 사진 갤러리, 그리고 따뜻한 마음을 남겨주실 수 있는 온라인 방명록을 담고 있습니다.

🇬🇧 This is the repository for our wedding mobile invitation and information sharing website. We are using this platform to share details about our **big day**, collect **cherished** moments, and manage a digital guestbook.

<br>

🇰🇷 저희의 결혼식 모바일 청첩장 및 정보 공유 웹사이트를 위한 저장소입니다. 소중한 날의 예식 일정, 하객 사진 갤러리, 그리고 따뜻한 마음을 남겨주실 수 있는 온라인 방명록을 담고 있습니다.

🇬🇧 This is the repository for our wedding mobile invitation and information sharing website. We are using this platform to share details about our **big day**, collect **cherished** moments, and manage a digital guestbook.

<br>

<p align="center">
  <img src="https://dummyimage.com/600x400/ffe6f2/ff4d94.png&text=Your+Beautiful+Wedding+Website" alt="Wedding Website Mockup">
</p>

<br>

## ✨ 주요 기능 (Key Features)

* **💌 모바일 청첩장 (Digital Invitation)**: 하객분들을 위한 맞춤형 모바일 초대장입니다.
* **📅 예식 정보 (Ceremony Details)**: 예식 일정, 오시는 길(지도), 주요 안내 사항을 제공합니다.
* **📖 온라인 방명록 (Guestbook)**: 축하의 메시지를 남길 수 있는 따뜻한 공간입니다.
* **📸 하객 사진 갤러리 (Guest Photo Gallery)**: 결혼식 날의 아름다운 순간들을 공유하고 업로드할 수 있습니다.
* **🎁 마음 전하실 곳 (Gift Registry / Contribution)**: 축하의 마음을 전할 수 있는 안내 페이지입니다.

## 🛠️ 기술 스택 (Built With)

<p align="center">
  <a href="https://react.dev/" target="_blank"><img src="https://img.shields.io/badge/react-20232a?style=for-the-badge&logo=react&logoColor=61dafb" alt="React Badge"></a>
  <a href="https://firebase.google.com/" target="_blank"><img src="https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Badge"></a>
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/vite-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge"></a>
  <a href="https://github.com/features/actions" target="_blank"><img src="https://img.shields.io/badge/github%20actions-2088ff?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions Badge"></a>
  <a href="https://pages.github.com/" target="_blank"><img src="https://img.shields.io/badge/github%20pages-222222?style=for-the-badge&logo=githubpages&logoColor=white" alt="GitHub Pages Badge"></a>
</p>

## 🚀 배포 및 보안 (Deployment & Security)

본 프로젝트는 보안과 무료 호스팅을 위해 이중 저장소 전략(Dual-repository strategy)으로 관리됩니다.
We manage this project with a dual-repository strategy:

* **`smyj-private`**: 실제 소스 코드가 관리되는 비공개 저장소(Source of Truth)입니다. 모든 개발 작업은 이곳에서 이루어집니다. / *Private repository where we manage the source code. All developments and pushes happen here.*
* **`smyj`**: 빌드된 결과물(HTML, JS, CSS)만 담기는 공개 저장소이며, 실제 서비스가 배포되는 곳입니다. / *Public repository containing only the built assets. This is where the deployed website resides.*

### 🔄 자동 배포 (Automated Deployment)
`smyj-private`에 코드가 푸시되면 **GitHub Actions**가 자동으로 빌드를 수행하고, **PAT (Personal Access Token)**를 사용하여 `smyj` 저장소로 결과물을 배포합니다.
*Pushes to the private repo trigger a GitHub Action that builds the project and automatically deploys the artifacts to this public repository.*

### 🔒 보안 및 데이터 관리 (Security & Data Management)
* **Firebase 보안 규칙**: API 키가 클라이언트에 노출되더라도 Firebase Security Rules를 통해 데이터 접근을 철저히 통제합니다.
* **데이터 만료 정책 (Expiration Policy)**: 예식 후 개인정보 보호를 위해 **2026년 7월 5일** 이후에는 방명록 및 사진 업로드/조회 기능이 자동으로 차단되도록 설정되었습니다. *(All read/write access to certain data will be restricted after July 5th, 2026.)*
* **CORS 설정 완료**: `github.io` 도메인에서의 원활한 스토리지 이미지 업로드를 위해 권한 설정이 적용되어 있습니다.

## 🤝 기여 (Contributing)

이 프로젝트는 저희의 개인적인 결혼식을 위한 웹사이트입니다. 하지만 버그를 발견하셨거나 제안할 점이 있다면 언제든 [Issue](https://github.com/maspo1/smyj/issues)를 남겨주세요! (소스 코드가 비공개이므로 직접적인 PR은 제한될 수 있습니다.)
*This is a personal project for our wedding. However, if you find a bug or have a feature suggestion, please feel free to open an issue.*

## 📄 라이선스 (License)

이 프로젝트는 MIT 라이선스에 따라 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.
*This project is licensed under the MIT License - see the LICENSE file for details.*

---

<p align="center">
  Created with love by <b>Sungmin & Yeonjeong</b>
  <br>
  © 2026 - present
</p>
