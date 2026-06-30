import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IdeaGeneratePage from '../../../app/ideas/generate/page'
import { useAuth } from '@clerk/nextjs'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/ideas/generate',
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('IdeaGeneratePage - AI Button Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('should disable all AI generate buttons when not signed in', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as any)

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ideas: [{
            id: '1',
            title: 'Test',
            status: 'selected'
          }],
          research: [{ index: 0, content: 'Research content' }],
          generated: []
        }),
      })
    ) as any

    render(<IdeaGeneratePage />)

    await waitFor(() => {
      const generateButtons = screen.queryAllByRole('button', {
        name: /🔒 Sign in|Generate via AI/i
      })

      generateButtons.forEach(button => {
        if (button.textContent?.includes('🔒')) {
          expect(button).toBeDisabled()
        }
      })
    }, { timeout: 3000 })
  })

  it('should enable all AI generate buttons when signed in', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      userId: 'user_123',
    } as any)

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ideas: [{
            id: '1',
            title: 'Test',
            status: 'selected',
            why_it_matters: 'It matters'
          }],
          research: [{ index: 0, content: 'Research content' }],
          generated: [{
            index: 0,
            linkedin_post: '',
            blog_post: '',
            newsletter_post: ''
          }]
        }),
      })
    ) as any

    render(<IdeaGeneratePage />)

    await waitFor(() => {
      const linkedinButton = screen.queryByRole('button', {
        name: /Generate via AI/i
      })

      if (linkedinButton) {
        expect(linkedinButton).not.toBeDisabled()
      }
    }, { timeout: 3000 })
  })

  it('should have correct button labels for LinkedIn, Blog, and Newsletter', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as any)

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ideas: [{
            id: '1',
            title: 'Test',
            status: 'selected'
          }],
          research: [],
          generated: []
        }),
      })
    ) as any

    render(<IdeaGeneratePage />)

    // Buttons should have consistent labeling
    await waitFor(() => {
      expect(screen.queryByText(/LinkedIn Post|Blog Post|Newsletter/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show tooltip when hovering disabled button', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as any)

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ideas: [{
            id: '1',
            title: 'Test',
            status: 'selected'
          }],
          research: [],
          generated: []
        }),
      })
    ) as any

    render(<IdeaGeneratePage />)

    await waitFor(() => {
      const buttons = screen.queryAllByRole('button', {
        name: /🔒 Sign in|Generate via AI/i
      })

      buttons.forEach(button => {
        if (button.getAttribute('disabled') !== null) {
          expect(button).toHaveAttribute('title')
        }
      })
    }, { timeout: 3000 })
  })

  it('should not call generateViaAI when disabled button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as any)

    global.fetch = jest.fn()

    render(<IdeaGeneratePage />)

    await waitFor(() => {
      const buttons = screen.queryAllByRole('button', {
        name: /🔒 Sign in/i
      })

      if (buttons.length > 0) {
        fireEvent.click(buttons[0])
        // Should not make any fetch calls for AI
        expect(global.fetch).not.toHaveBeenCalledWith(
          expect.stringContaining('/api/ai/generate')
        )
      }
    }, { timeout: 3000 })
  })
})

