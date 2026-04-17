import { z } from 'zod'

// Test the validation schemas used in auth endpoints
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

describe('Auth Validation Schemas', () => {
  describe('Signup Validation', () => {
    it('should accept valid signup data', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPassword123',
        fullName: 'Test User',
      }

      const result = signupSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'ValidPassword123',
        fullName: 'Test User',
      }

      const result = signupSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const data = {
        email: 'test@example.com',
        password: 'short',
        fullName: 'Test User',
      }

      const result = signupSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some((e) => e.path[0] === 'password')).toBe(true)
      }
    })

    it('should reject short fullName', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPassword123',
        fullName: 'A',
      }

      const result = signupSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const data = {
        password: 'ValidPassword123',
        fullName: 'Test User',
      }

      const result = signupSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Login Validation', () => {
    it('should accept valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPassword123',
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'ValidPassword123',
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const data = {
        password: 'ValidPassword123',
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing password', () => {
      const data = {
        email: 'test@example.com',
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Forgot Password Validation', () => {
    it('should accept valid forgot password data', () => {
      const data = {
        email: 'test@example.com',
      }

      const result = forgotPasswordSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
      }

      const result = forgotPasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const data = {}

      const result = forgotPasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
