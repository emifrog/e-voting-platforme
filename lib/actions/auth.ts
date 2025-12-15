'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'

// Durée de session : 15 minutes par défaut, 1 heure si "rester connecté"
const SESSION_DURATION_DEFAULT = 60 * 15 // 15 minutes en secondes
const SESSION_DURATION_REMEMBER = 60 * 60 // 1 heure en secondes

export async function login(formData: FormData) {
  const emailInput = formData.get('email') as string
  const rememberMe = formData.get('rememberMe') === 'on'

  // Rate limiting protection against brute force avec notre nouveau système
  try {
    await checkRateLimit('LOGIN', emailInput || 'unknown')
  } catch {
    redirect(`/login?error=${encodeURIComponent('Trop de tentatives. Veuillez réessayer dans quelques instants.')}`)
  }

  const supabase = await createClient()

  // Validate input
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const errorMsg = Object.values(errors).flat().join(', ')
    redirect(`/login?error=${encodeURIComponent(errorMsg)}`)
  }

  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('Email ou mot de passe incorrect')}`)
  }

  // Stocker la préférence "rester connecté" dans un cookie
  const cookieStore = await cookies()
  const sessionDuration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT

  cookieStore.set('session_duration', sessionDuration.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionDuration,
    path: '/',
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const emailInput = formData.get('email') as string

  // Rate limiting protection
  try {
    await checkRateLimit('REGISTER', emailInput || 'unknown')
  } catch (error) {
    redirect(`/register?error=${encodeURIComponent('Trop d\'inscriptions. Veuillez réessayer plus tard.')}`)
  }

  const supabase = await createClient()

  // Validate input
  const validatedFields = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    fullName: formData.get('fullName'),
  })

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const errorMsg = Object.values(errors).flat().join(', ')
    redirect(`/register?error=${encodeURIComponent(errorMsg)}`)
  }

  const { email, password, fullName } = validatedFields.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
