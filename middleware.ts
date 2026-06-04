import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public routes that don't need auth or status checks
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/pending-approval']

  // Redirect logged-in users away from public auth pages
  if (user && publicRoutes.includes(pathname) && pathname !== '/pending-approval') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protected route check
  const protectedPrefixes = ['/dashboard', '/contacts', '/emails', '/admin']
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p))

  if (!user && isProtected) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // For logged-in users on protected routes, check account status
  // Uses service role to bypass RLS — anon client returns null for pending users
  if (user && isProtected) {
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: profile } = await adminDb
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'pending') {
      return NextResponse.redirect(new URL('/pending-approval', request.url))
    }

    if (profile?.status === 'rejected') {
      await supabase.auth.signOut()
      const url = new URL('/login', request.url)
      url.searchParams.set('error', 'Your account has been rejected. Contact an admin.')
      return NextResponse.redirect(url)
    }
  }

  // Admin check
  if (pathname.startsWith('/admin') && user) {
    const { data: role } = await supabase.rpc('get_my_role')
    if (!role || role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
