# Google 로그인 (Supabase)

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth 클라이언트 ID (웹) 생성  
   - 승인된 리디렉션 URI: `https://bvxatgurkrjanlqctpeo.supabase.co/auth/v1/callback`  
   - Supabase Dashboard → Authentication → **URL Configuration**  
     - Site URL: `https://idittofit.vercel.app` (로컬만 쓸 때는 `http://localhost:3000`)  
     - Redirect URLs: `http://localhost:3000/**`, `https://idittofit.vercel.app/**`

2. [Supabase Dashboard](https://supabase.com/dashboard/project/bvxatgurkrjanlqctpeo/auth/providers) → **Google** 활성화, Client ID / Secret 입력

3. env (로컬 `.env.local`, Vercel):  
   - `NEXT_PUBLIC_SUPABASE_URL`  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. `npm run dev` → `/login` → Google로 계속 → `/plan/import`
