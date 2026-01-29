-- Thay đổi 'your_email@example.com' thành email của tài khoản bạn muốn cấp quyền Admin
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'your_email@example.com'
);

-- Kiểm tra lại kết quả sau khi chạy
SELECT * FROM public.profiles WHERE is_admin = TRUE;
