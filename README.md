# 🐺 Werewolf Online — Dự án Cuối Kỳ (Lập trình thiết bị di động)

![Banner](https://img.shields.io/badge/Status-Hoàn%20Thành%20100%25-brightgreen)
![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Cloud-47A248)

Dự án game **Ma Sói trực tuyến (Werewolf Online)** hoàn chỉnh, kết hợp kiến trúc Client-Server với công nghệ WebRTC (Voice Chat) và Real-time Web Sockets. Ứng dụng hỗ trợ chơi đa nền tảng nhờ tích hợp thông minh qua React Native WebView.

---

## 👥 Thành viên nhóm & Phân công công việc (CK07, CK08)
Dự án được thực hiện với tinh thần làm việc nhóm cao, quản lý mã nguồn chặt chẽ và giao tiếp hiệu quả (CK05):

| STT | Mã SV | Họ và Tên | Tỷ lệ đóng góp | Vai trò / Nhiệm vụ chính |
|:---:|:---:|:---|:---:|:---|
| 1 | **123000926** | **Lê Trọng Phúc Hậu** | 100% | Phát triển Server-side (Node.js, Socket.io), Kiến trúc Core Engine (Zero-Trust), Database (MongoDB), UI/UX cho Web Client. |
| 2 | **123001217** | **Vũ Đình Khánh Long** | 100% | Phát triển Mobile App (React Native/Expo), Tích hợp WebView cross-platform, Tối ưu hoá Network & Audio permissions, Testing hệ thống. |

---

## 🎯 Mức độ đáp ứng tiêu chí đánh giá (Rubric)

* **CK01 - Phần mềm hoàn chỉnh (3đ):** Game hoạt động trơn tru 100% với toàn bộ luật chơi Ma Sói tiêu chuẩn. Đầy đủ các pha (Lobby, Night, Day, Voting, Execution) và hệ thống chức năng cho từng vai trò (Sói, Tiên Tri, Phù Thủy, Bảo Vệ, Thợ Săn, Dân Làng).
* **CK02 - Triển khai thực tế (0.5đ):** Triển khai thành công trên môi trường mạng thực tế (LAN/Wi-Fi). Ứng dụng mobile đáp ứng hoàn hảo thông qua Expo Go (có xử lý tự động nhận diện IP). Đã sử dụng test-bots để mô phỏng tải 7-10 người chơi đồng thời.
* **CK03 - Mô hình ứng dụng (1.5đ):** 
  * Mô hình **Zero-Trust Authoritative Server**: Mọi logic quyết định sự sống/chết, kết quả bình chọn, hiệu ứng ban đêm đều được xử lý 100% ở Server. Client chỉ chịu trách nhiệm hiển thị (View) và gửi hành động (Action).
  * **Kiến trúc WebView Wrapper:** App React Native bọc toàn bộ giao diện Web, giúp đồng bộ codebase giao diện cho mọi nền tảng (Web/Android/iOS) mà không cần code lại UI native, triệt tiêu lỗi đồng bộ phiên bản.
* **CK04 - Thiết kế cơ sở dữ liệu (1đ):** Tích hợp **MongoDB (Cloud)** làm Database để lưu trữ và nạp bộ cấu hình vai trò (Role Cache) vào RAM khi khởi động server, đảm bảo tính động và khả năng mở rộng trong tương lai.
* **CK05 - Công cụ quản lý (1đ):** Quản lý tiến trình thông suốt, commit rõ ràng để ghép nối phần Mobile và Web Server.

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

Yêu cầu máy tính và điện thoại **kết nối cùng một mạng Wi-Fi/LAN**.

### 1. Khởi động Server (Game Engine & Web Host)
```bash
cd werewolf-server
npm install
# Khởi động server (Mặc định chạy ở port 3000)
npm start
```
*Ghi chú: Server sẽ tự động kết nối MongoDB và nạp dữ liệu vai trò.*

### 2. Khởi động Mobile Client (React Native)
Mở một terminal mới (không đóng terminal của server):
```bash
cd werewolf-client
npm install
# Khởi động Expo Server
npx expo start
```
* Dùng ứng dụng **Expo Go** (trên Android/iOS) quét mã QR hiện ra trong terminal.
* App sẽ tự động tìm địa chỉ IP của máy chủ trong mạng LAN và load giao diện game.

### 3. (Tuỳ chọn) Chơi trên trình duyệt máy tính
Người chơi không có app điện thoại hoàn toàn có thể chơi chung bằng cách mở trình duyệt (Chrome/Edge) và truy cập:
`http://<IP-Máy-Chủ>:3000` (VD: `http://192.168.1.7:3000`)

---

## 🎮 Tính năng nổi bật
- 🎙️ **Voice Chat (WebRTC):** Tích hợp chat voice thời gian thực.
- 🎨 **Giao diện chuẩn Game:** UI đồ họa chất lượng cao (Dark Fantasy/Medieval), tích hợp CSS responsive hoàn toàn (ưu tiên Mobile-first).
- ⚙️ **Game Engine chuyên sâu:** Xử lý hàng đợi ban đêm (Batch Processing), đồng bộ đếm ngược (Game Clock) và cập nhật trạng thái (State Sync).
- 🥾 **Quản lý phòng chơi:** Chủ phòng có thể chỉnh sửa cài đặt, kick người chơi. Hệ thống tự động xử lý kết nối/ngắt kết nối an toàn.
- 🤖 **Auto-test Bots:** Cung cấp sẵn hệ thống `test-bots.js` cho phép tạo tự động người chơi máy (bots) để test luồng game mà không cần rủ thêm người.

## 📝 Nhật ký thay đổi (Changelog cuối)
- Sửa lỗi load chậm trên app điện thoại (chặn double routing).
- Nâng cấp giao diện thân thiện với kích thước màn hình nhỏ.
- Hoàn thiện tính năng Kick người chơi.
- Đồng bộ cơ chế Night Resolution hoàn hảo cho tất cả các vai trò phức tạp (Thợ Săn, Phù Thủy, Bảo Vệ).

Cảm ơn thầy cô đã xem xét dự án của nhóm chúng em! ❤️
