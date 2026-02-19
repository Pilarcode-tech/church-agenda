import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('payload-token')

  // Rotas públicas: login
  if (req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // Rotas do admin do Payload: não interferir
  if (req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // API routes: não interferir (auth é feita dentro de cada route)
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Frontend: exige autenticação
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
