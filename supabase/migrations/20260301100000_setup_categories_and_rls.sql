-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Cho phép tất cả mọi người được xem (SELECT) danh mục
CREATE POLICY "Public categories are viewable by everyone." 
ON public.categories FOR SELECT 
USING (true);

-- 2. Policy: Cho phép Admin (is_admin = true) được quyền Thêm, Sửa, Xóa (INSERT, UPDATE, DELETE)
-- Lưu ý: Cột is_admin phải tồn tại trong bảng profiles (như file supabase_admin_setup.sql đã cấu hình)
CREATE POLICY "Admins can modify categories" 
ON public.categories FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 3. Thêm 3 danh mục mới
-- Sử dụng ON CONFLICT để tránh lỗi trùng lặp khi chạy migration nhiều lần (yêu cầu cột slug có UNIQUE constraint)
-- Nếu slug không có UNIQUE constraint, query vẫn có thể chạy bình thường nếu chỉ chạy 1 lần.
INSERT INTO public.categories (name, slug)
VALUES 
  ('Túi đeo chéo & Túi đeo vai', 'tui-deo-cheo-tui-deo-vai'),
  ('Túi quai xách', 'tui-quai-xach'),
  ('Túi tote', 'tui-tote');
