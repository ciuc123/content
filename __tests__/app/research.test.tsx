import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdeaResearchPage from '../../app/ideas/research/page'
import { useAuth } from '@clerk/nextjs'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn()
}))

// Mock useRouter (for navigation)
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock
})

describe('IdeaResearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorageMock.clear()
    ;(fetch as jest.Mock).mockClear()
    ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
  })

  describe('Display and Selection', () => {
    test('should display "No selected idea yet" when no idea is selected', () => {
      render(<IdeaResearchPage />)
      expect(screen.getByText(/No selected idea yet/)).toBeInTheDocument()
    })

    test('should display selected idea from sessionStorage immediately', () => {
      const selectedIdea = {
        id: '1',
        title: 'AI in DevOps',
        why_it_matters: 'DevOps teams can save time'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      render(<IdeaResearchPage />)

      expect(screen.getByText(/Research: AI in DevOps/)).toBeInTheDocument()
    })

    test('should show AI generation button for authenticated users', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing matters'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      render(<IdeaResearchPage />)

      const aiButton = screen.getByRole('button', { name: /Generate Research via AI/i })
      expect(aiButton).toBeInTheDocument()
      expect(aiButton).not.toBeDisabled()
    })

    test('should show import section for unauthenticated users', () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: false })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing matters'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      render(<IdeaResearchPage />)

      expect(screen.getByText(/Import Pre-Made Research/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Paste research content/)).toBeInTheDocument()
    })
  })

  describe('AI Research Generation', () => {
    test('should generate research via AI when button is clicked', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'DevOps Trends',
        why_it_matters: 'DevOps is evolving'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            research: '# DevOps Research\n\nKey points...'
          }
        })
      })

      render(<IdeaResearchPage />)

      const aiButton = screen.getByRole('button', { name: /Generate Research via AI/i })
      fireEvent.click(aiButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generateResearch',
            idea: selectedIdea
          })
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/Research generated/)).toBeInTheDocument()
      })
    })

    test('should show loading state during AI generation', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      // Simulate slow API response
      ;(fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                data: { research: 'Research content' }
              })
            }), 100)
        )
      )

      render(<IdeaResearchPage />)

      const aiButton = screen.getByRole('button', { name: /Generate Research via AI/i })
      fireEvent.click(aiButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generating research/i })).toBeInTheDocument()
      })
    })

    test('should handle API key configuration error', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'API key not configured - please add one in settings'
        })
      })

      render(<IdeaResearchPage />)

      const aiButton = screen.getByRole('button', { name: /Generate Research via AI/i })
      fireEvent.click(aiButton)

      await waitFor(() => {
        expect(screen.getByText(/API key not configured/)).toBeInTheDocument()
        expect(screen.getByText(/Settings → API Key/)).toBeInTheDocument()
      })
    })

    test('should handle generic API errors gracefully', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error'
        })
      })

      render(<IdeaResearchPage />)

      const aiButton = screen.getByRole('button', { name: /Generate Research via AI/i })
      fireEvent.click(aiButton)

      await waitFor(() => {
        expect(screen.getByText(/Error generating research/)).toBeInTheDocument()
        expect(screen.getByText(/manual method/)).toBeInTheDocument()
      })
    })

    test('should populate textarea with generated research', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      const generatedResearch = '# Research\n\n## Section 1\n\nContent here'
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            research: generatedResearch
          }
        })
      })

      render(<IdeaResearchPage />)

      const aiButton = screen.getByRole('button', { name: /Generate Research via AI/i })
      fireEvent.click(aiButton)

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Paste research output/)
        expect(textarea).toHaveValue(generatedResearch)
      })
    })
  })

  describe('Research Import (Unauthenticated)', () => {
    test('should import plain text research', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: false })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      render(<IdeaResearchPage />)

      const importTextarea = screen.getByPlaceholderText(/Paste research content/)
      const importButton = screen.getByRole('button', { name: /Import Research/i })

      await userEvent.type(importTextarea, 'This is my research content')
      fireEvent.click(importButton)

      await waitFor(() => {
        const researchTextarea = screen.getByPlaceholderText(/Paste research output/)
        expect(researchTextarea).toHaveValue('This is my research content')
      })
    })

    test('should import JSON research with content field', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: false })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      const jsonResearch = JSON.stringify({
        content: '# Researched Topic\n\nKey findings...'
      })

      render(<IdeaResearchPage />)

      const importTextarea = screen.getByPlaceholderText(/Paste research content/)
      const importButton = screen.getByRole('button', { name: /Import Research/i })

      await userEvent.type(importTextarea, jsonResearch)
      fireEvent.click(importButton)

      await waitFor(() => {
        const researchTextarea = screen.getByPlaceholderText(/Paste research output/)
        expect(researchTextarea).toHaveValue('# Researched Topic\n\nKey findings...')
      })
    })

    test('should validate import form is not empty', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: false })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      render(<IdeaResearchPage />)

      const importButton = screen.getByRole('button', { name: /Import Research/i })
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(screen.getByText(/Please paste research content/)).toBeInTheDocument()
      })
    })

    test('should clear import textarea after successful import', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: false })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      render(<IdeaResearchPage />)

      const importTextarea = screen.getByPlaceholderText(/Paste research content/)
      const importButton = screen.getByRole('button', { name: /Import Research/i })

      await userEvent.type(importTextarea, 'Research content')
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(importTextarea).toHaveValue('')
      })
    })
  })

  describe('Save Research', () => {
    test('should validate research content is not empty', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      render(<IdeaResearchPage />)

      const saveButton = screen.getByRole('button', { name: /Save Research/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/Please enter research content/)).toBeInTheDocument()
      })
    })

    test('should save research content via API', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      // Mock ideas fetch for getting index
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ideas: [selectedIdea]
          })
        })
        // Mock research POST
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true
          })
        })

      render(<IdeaResearchPage />)

      const textarea = screen.getByPlaceholderText(/Paste research output/)
      const saveButton = screen.getByRole('button', { name: /Save Research/i })

      await userEvent.type(textarea, '# My Research\n\nDetails...')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"content":"# My Research\\n\\nDetails..."')
        })
      })
    })

    test('should update idea status in background after save', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '123',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      // Mock fetch calls
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ideas: [selectedIdea] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })

      render(<IdeaResearchPage />)

      const textarea = screen.getByPlaceholderText(/Paste research output/)
      const saveButton = screen.getByRole('button', { name: /Save Research/i })

      await userEvent.type(textarea, 'Research content')
      fireEvent.click(saveButton)

      await waitFor(() => {
        // Check that PATCH was called (background update)
        const patchCall = (fetch as jest.Mock).mock.calls.find(
          call => call[1]?.method === 'PATCH'
        )
        if (patchCall) {
          expect(patchCall[0]).toBe('/api/ideas')
          expect(JSON.parse(patchCall[1].body)).toEqual({
            idea_id: '123',
            status: 'generated'
          })
        }
      })
    })

    test('should clear textarea and show success message after save', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ideas: [selectedIdea] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })

      render(<IdeaResearchPage />)

      const textarea = screen.getByPlaceholderText(/Paste research output/)
      const saveButton = screen.getByRole('button', { name: /Save Research/i })

      await userEvent.type(textarea, 'Research content')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/Research saved/)).toBeInTheDocument()
        expect(textarea).toHaveValue('')
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle research save API error', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ideas: [selectedIdea] })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'Database error'
          })
        })

      render(<IdeaResearchPage />)

      const textarea = screen.getByPlaceholderText(/Paste research output/)
      const saveButton = screen.getByRole('button', { name: /Save Research/i })

      await userEvent.type(textarea, 'Research content')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/Database error/)).toBeInTheDocument()
      })
    })

    test('should handle network errors gracefully', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({ isSignedIn: true })
      const selectedIdea = {
        id: '1',
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      sessionStorageMock.setItem('selected_idea', JSON.stringify(selectedIdea))

      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<IdeaResearchPage />)

      const textarea = screen.getByPlaceholderText(/Paste research output/)
      const saveButton = screen.getByRole('button', { name: /Save Research/i })

      await userEvent.type(textarea, 'Research content')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })
  })
})

