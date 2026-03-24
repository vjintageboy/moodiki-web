# Tổng Quan Dự Án: Mental Health Admin Panel

## 1. Giới thiệu chung
Đây là một hệ thống Dashboard/Admin Panel dùng để quản lý các thành phần của một ứng dụng chăm sóc sức khỏe tinh thần (Mental Health App). Hệ thống cung cấp giao diện quản trị hiện đại, toàn diện để theo dõi, điều hành và quản lý nội dung số, người dùng cũng như các chuyên gia tư vấn.

## 2. Công nghệ sử dụng (Tech Stack)
Dự án được xây dựng dựa trên các công nghệ web hiện đại mới nhất:
- **Framework & Core:** Next.js 16.2.1 (App Router), React 19.
- **Ngôn ngữ:** TypeScript.
- **Styling & UI:** Tailwind CSS v4, shadcn/ui (Radix UI), @base-ui/react.
- **Hiệu ứng & Hoạt ảnh (Animation):** Framer Motion, tw-animate-css.
- **Quản lý Form & Validate:** React Hook Form, zod, @hookform/resolvers.
- **Cơ sở dữ liệu & Xác thực (Backend-as-a-Service):** Supabase (@supabase/supabase-js, @supabase/ssr).
- **Trí tuệ Nhân tạo (AI):** Tích hợp Gemini AI của Google (@google/genai).
- **Biểu đồ (Charts):** Recharts.
- **Tiện ích:** date-fns (xử lý thời gian), sonner (toast notification), lucide-react (icons).

## 3. Cấu trúc thư mục lõi
- **`app/`**: Chứa toàn bộ logic routing (App Router).
  - **`(auth)/`**: Layout và các trang liên quan tới xác thực người dùng (Login, Register...).
  - **`(dashboard)/`**: Khu vực dành riêng cho admin đã đăng nhập, chứa các tính năng quản lý.
- **`components/`**: Chứa các component UI tái sử dụng (shadcn UI, base component...).
- **`lib/`**: Chứa các hàm tiện ích (utils) và khởi tạo kết nối với Supabase (`lib/supabase/*`).

## 4. Các tính năng chính (Dựa trên cấu trúc Routing)
Từ kiến trúc `app/(dashboard)`, ta thấy hệ thống bao gồm các mô-đun chính:

1. **Tổng quan & Phân tích (Analytics / Dashboard):**
   - Theo dõi các số liệu tổng quan về hoạt động ứng dụng, người dùng bằng bảng và biểu đồ trực quan (`/analytics`, tràng chủ dashboard `/`).

2. **Quản lý Người dùng (Users):**
   - Quản lý thông tin tài khoản, danh sách người dùng thông thường (`/users`).

3. **Quản lý Chuyên gia (Experts):**
   - Quản lý danh sách y bác sĩ, chuyên gia tâm lý tư vấn trên hệ thống (`/experts`).

4. **Quản lý Lịch hẹn (Appointments):**
   - Theo dõi, điều phối và quản lý các lịch hẹn tư vấn/khám bệnh giữa người dùng và chuyên gia (`/appointments`).

5. **Quản lý Bài viết (Posts):**
   - Tương đương với một tiểu Blog/CMS thu nhỏ để quản lý các bài chia sẻ kiến thức, mẹo bảo vệ sức khỏe tâm thần (`/posts`).

6. **Quản lý Nội dung Thiền (Meditations):**
   - Nơi quản lý video, âm thanh hoặc các bài hướng dẫn thiền định cung cấp cho người dùng (`/meditations`).

7. **Trợ lý AI & Sinh ảnh (AI Features):**
   - **`/ai-chat`**: Tính năng Chatbot quản trị viên (có thể tích hợp với Gemini) để hỗ trợ thao tác, truy xuất dữ liệu tự động hoặc tương tác với tư cách hỗ trợ hệ thống.
   - **`/image-gen`**: Trình tạo hình ảnh tự động AI (DALL-E hoặc Gemini) phục vụ tạo ảnh bìa, ảnh mô tả cho các bài thiền hoặc bài viết (posts) mà không cần tốn sức thiết kế.

8. **Cài đặt Hệ thống (Settings):**
   - Cấu hình các thông số chung của admin panel và tài khoản cá nhân (`/settings`).

## 5. Kiến trúc định hướng phát triển
- Ứng dụng quản trị viên (Admin Panel) hoạt động hoàn toàn dựa trên Backend là **Supabase**, giao tiếp thẳng từ Frontend qua Server Actions (với SSR support từ Next.js) làm lớp Controller.
- Ứng dụng tận dụng mạnh mẽ các khả năng AI từ model của **Google Gemini** để hỗ trợ trong công tác tạo nội dung và vận hành.
- Giao diện Admin đảm bảo Dark/Light mode, thân thiện, dễ vận hành với tốc độ cao dựa trên hệ thống caching tối tân của Next.js 16.
