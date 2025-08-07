import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskData } from '@/types';
import { ChatMessage } from '../../types/quiz';

// Mock CSS imports
jest.mock('@blocknote/core/fonts/inter.css', () => ({}), { virtual: true });
jest.mock('@blocknote/mantine/style.css', () => ({}), { virtual: true });
jest.mock('../../components/editor-styles.css', () => ({}), { virtual: true });

// Mock localStorage with safeLocalStorage implementation
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

// Mock safeLocalStorage
jest.mock('@/lib/utils/localStorage', () => ({
    safeLocalStorage: mockLocalStorage
}));

// Import component after CSS mocks
import LearningMaterialViewer from '../../components/LearningMaterialViewer';

// Mock the BlockNoteEditor component
jest.mock('../../components/BlockNoteEditor', () => ({
    __esModule: true,
    default: jest.fn(({ initialContent, readOnly }) => (
        <div data-testid="block-note-editor" data-read-only={readOnly}>
            <span data-testid="editor-content">{JSON.stringify(initialContent)}</span>
        </div>
    ))
}));

// Mock ChatView component - match the props from the actual component
jest.mock('../../components/ChatView', () => ({
    __esModule: true,
    default: jest.fn(({
        currentChatHistory,
        isAiResponding,
        isSubmitting,
        currentAnswer,
        handleInputChange,
        handleSubmitAnswer,
        handleRetry
    }) => (
        <div data-testid="chat-view">
            <div data-testid="chat-history">{JSON.stringify(currentChatHistory)}</div>
            <input
                data-testid="chat-input"
                value={currentAnswer}
                onChange={(e) => handleInputChange(e)}
            />
            <button
                data-testid="submit-button"
                disabled={isSubmitting}
                onClick={() => handleSubmitAnswer()}>
                Submit
            </button>
            <button
                data-testid="retry-button"
                onClick={handleRetry}>
                Retry
            </button>
            {isAiResponding && <div data-testid="ai-responding-indicator">AI is thinking...</div>}
        </div>
    ))
}));

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://test-api.example.com';

describe('LearningMaterialViewer Component', () => {
    const mockTaskId = '123';
    const mockUserId = 'user-123';
    const mockOnMarkComplete = jest.fn();

    // Sample task data for mock responses
    const mockTaskData: TaskData = {
        id: mockTaskId,
        title: 'Test Task',
        blocks: [
            {
                type: 'paragraph',
                content: [{ text: 'Test content', type: 'text', styles: {} }]
            }
        ],
        status: 'published'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockReset();
        mockLocalStorage.getItem.mockReset();
        mockLocalStorage.setItem.mockReset();

        // Reset window.innerWidth to default desktop size
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200,
        });
    });

    it('should render the viewer in loading state initially', () => {
        // Mock fetch to delay responding
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: async () => mockTaskData
            }), 100))
        );

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        // The component uses an animate-spin class for the loading spinner
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should fetch task data when taskId is provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `http://test-api.example.com/tasks/${mockTaskId}`,
                expect.anything()
            );
        });
    });

    it('should render the viewer with task data when loaded', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });
    });

    it('should render the BlockNoteEditor with readOnly prop set to true', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            const editor = screen.getByTestId('block-note-editor');
            expect(editor).toBeInTheDocument();
            expect(editor.getAttribute('data-read-only')).toBe('true');
        });
    });

    it('should check localStorage for hasClickedFabButton on mount', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        // Mock localStorage to return that user has clicked the button before
        mockLocalStorage.getItem.mockReturnValueOnce('true');

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('hasClickedLMActionsButton');
    });

    it('should toggle the chat view when ask doubt button is clicked', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Find and click the ask doubt button - uses aria-label in the component
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        // Chat view should be visible
        expect(screen.getByTestId('chat-view')).toBeInTheDocument();

        // Click the close button to hide chat
        const closeButton = screen.getByRole('button', { name: /close chat/i });
        fireEvent.click(closeButton);

        // Chat should now be hidden
        await waitFor(() => {
            expect(screen.queryByTestId('chat-view')).not.toBeInTheDocument();
        });
    });

    it('should handle mark complete button click when provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        // Set mobile view BEFORE rendering
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 800,
        });

        // Render with onMarkComplete prop
        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
                onMarkComplete={mockOnMarkComplete}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Trigger resize event to ensure mobile view is detected
        fireEvent(window, new Event('resize'));

        // Wait a bit for the resize handler to execute
        await waitFor(() => {
            // For mobile with onMarkComplete, the button should toggle mobile menu 
            const toggleButton = screen.getByRole('button', { name: /ask a doubt/i });
            fireEvent.click(toggleButton);
        });

        // Now mobile menu should be visible - look for mark complete button
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument();
        });

        // Then find and click the mark complete button in the menu
        const markCompleteButton = screen.getByRole('button', { name: /mark as complete/i });
        fireEvent.click(markCompleteButton);

        // Check if onMarkComplete was called
        expect(mockOnMarkComplete).toHaveBeenCalled();
    });

    it('should handle chat submission correctly', async () => {
        // Mock initial task fetch
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Open chat view
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        // Chat view should be visible
        expect(screen.getByTestId('chat-view')).toBeInTheDocument();

        // Simulate typing in chat input
        const chatInput = screen.getByTestId('chat-input');
        fireEvent.change(chatInput, { target: { value: 'Test question' } });

        // Mock the fetch response for chat submission with a simpler approach
        const mockReader = {
            read: jest.fn()
                .mockResolvedValueOnce({
                    done: false,
                    value: new Uint8Array(Buffer.from(JSON.stringify({ response: 'Test response from AI' })))
                })
                .mockResolvedValueOnce({
                    done: true,
                    value: undefined
                })
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        });

        // Submit the chat
        fireEvent.click(screen.getByTestId('submit-button'));

        // AI responding indicator should be visible
        expect(screen.getByTestId('ai-responding-indicator')).toBeInTheDocument();

        // Check that fetch was called with the right params
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/chat`,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.any(String)
                })
            );
        });
    });

    it('should handle API errors gracefully', async () => {
        console.error = jest.fn(); // Suppress expected console errors

        // Mock API error
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        // Component should render without crashing
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /ask a doubt/i })).toBeInTheDocument();
        });
    });

    it('should render in viewOnly mode without action buttons', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
                viewOnly={true}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // In viewOnly mode, action buttons should not be present
        expect(screen.queryByRole('button', { name: /ask a doubt/i })).not.toBeInTheDocument();
    });

    it('should handle window resize to mobile view', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Simulate window resize to mobile
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 800,
        });

        // Trigger resize event
        fireEvent(window, new Event('resize'));

        // The component should still render correctly
        expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
    });

    it('should close mobile menu when clicking outside', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        // Set mobile view BEFORE rendering
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 800,
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
                onMarkComplete={mockOnMarkComplete}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Trigger resize event to ensure mobile view is detected
        fireEvent(window, new Event('resize'));

        // Wait for resize handler and then open mobile menu
        await waitFor(() => {
            const helpButton = screen.getByRole('button', { name: /ask a doubt/i });
            fireEvent.click(helpButton);
        });

        // Mobile menu should be open
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument();
        });

        // Click outside the menu
        fireEvent.mouseDown(document.body);

        // Menu should close
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /mark as complete/i })).not.toBeInTheDocument();
        });
    });

    it('should handle empty response in chat correctly', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Open chat view
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        // Try to submit empty message
        fireEvent.click(screen.getByTestId('submit-button'));

        // Should not make any API call for empty message
        expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial task fetch
    });

    it('should handle different isDarkMode props', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
                isDarkMode={false}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Component should render with light mode
        expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
    });

    it('should handle readOnly prop being false', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
                readOnly={false}
            />
        );

        await waitFor(() => {
            const editor = screen.getByTestId('block-note-editor');
            expect(editor).toBeInTheDocument();
            expect(editor.getAttribute('data-read-only')).toBe('true'); // Still true because the component forces readOnly=true
        });
    });

    it('should render without taskId', () => {
        render(
            <LearningMaterialViewer
                userId={mockUserId}
            />
        );

        // Should not make any API calls
        expect(global.fetch).not.toHaveBeenCalled();

        // Without taskId, component shows loading spinner since isLoading defaults to true
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should save localStorage when clicking action button for first time', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        // Mock localStorage to indicate user hasn't clicked before
        mockLocalStorage.getItem.mockReturnValueOnce(null);

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Click the action button
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        // Should save to localStorage  
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hasClickedFabButton', 'true');
    });

    it('should handle fetch error in task loading', async () => {
        console.error = jest.fn(); // Suppress error logs

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        // Component should still render with action button even if task loading failed
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /ask a doubt/i })).toBeInTheDocument();
        });

        // Editor should still be present with undefined initial content
        expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
    });

    it('should handle fetch non-ok response', async () => {
        console.error = jest.fn(); // Suppress error logs

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /ask a doubt/i })).toBeInTheDocument();
        });

        // Editor should still be present with undefined initial content
        expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
    });

    it('should handle chat error during streaming', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Open chat
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        // Type a message
        const chatInput = screen.getByTestId('chat-input');
        fireEvent.change(chatInput, { target: { value: 'Test question' } });

        // Mock streaming error response
        const mockReader = {
            read: jest.fn().mockRejectedValueOnce(new Error('Stream error'))
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        });

        // Submit chat
        fireEvent.click(screen.getByTestId('submit-button'));

        // Should handle the error gracefully
        await waitFor(() => {
            expect(screen.getByTestId('chat-view')).toBeInTheDocument();
        });
    });

    it('should handle chat API error response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Open chat
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        // Type a message
        const chatInput = screen.getByTestId('chat-input');
        fireEvent.change(chatInput, { target: { value: 'Test question' } });

        // Mock API error
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        // Submit chat
        fireEvent.click(screen.getByTestId('submit-button'));

        // Should handle the error gracefully
        await waitFor(() => {
            expect(screen.getByTestId('chat-view')).toBeInTheDocument();
        });
    });

    it('should handle retry functionality', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Open chat
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        // Type a message
        const chatInput = screen.getByTestId('chat-input');
        fireEvent.change(chatInput, { target: { value: 'Test question' } });

        // Mock successful response for initial request
        const mockReader = {
            read: jest.fn()
                .mockResolvedValueOnce({
                    done: false,
                    value: new Uint8Array(Buffer.from(JSON.stringify({ response: 'Initial response' })))
                })
                .mockResolvedValueOnce({
                    done: true,
                    value: undefined
                })
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        });

        // Submit initial message
        fireEvent.click(screen.getByTestId('submit-button'));

        // Wait for the message to be added to chat history (the user message should appear)
        await waitFor(() => {
            expect(screen.getByTestId('chat-history')).toHaveTextContent('Test question');
        });

        // Mock retry response
        const retryMockReader = {
            read: jest.fn()
                .mockResolvedValueOnce({
                    done: false,
                    value: new Uint8Array(Buffer.from(JSON.stringify({ response: 'Retry response' })))
                })
                .mockResolvedValueOnce({
                    done: true,
                    value: undefined
                })
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => retryMockReader
            }
        });

        // Now test retry functionality
        const retryButton = screen.getByTestId('retry-button');
        fireEvent.click(retryButton);

        // Should trigger another API call
        expect(global.fetch).toHaveBeenCalledTimes(3); // task fetch + initial chat + retry
    });

    it('should handle mobile chat closing animation', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskData
        });

        // Set mobile view 
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 800,
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Trigger resize event
        fireEvent(window, new Event('resize'));

        // Open chat 
        const askDoubtButton = screen.getByRole('button', { name: /ask a doubt/i });
        fireEvent.click(askDoubtButton);

        await waitFor(() => {
            expect(screen.getByTestId('chat-view')).toBeInTheDocument();
        });

        // Close chat - should trigger animation
        const closeButton = screen.getByRole('button', { name: /close chat/i });
        fireEvent.click(closeButton);

        // Chat should still be visible during animation
        expect(screen.getByTestId('chat-view')).toBeInTheDocument();
    });

    it('should handle empty task blocks', async () => {
        const emptyTaskData = {
            ...mockTaskData,
            blocks: []
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => emptyTaskData
        });

        render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
        });

        // Should render editor even with empty blocks
        expect(screen.getByTestId('block-note-editor')).toBeInTheDocument();
    });

    it('should handle component cleanup on unmount', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            new Promise(resolve => setTimeout(() => resolve({
                ok: true,
                json: async () => mockTaskData
            }), 100))
        );

        const { unmount } = render(
            <LearningMaterialViewer
                taskId={mockTaskId}
                userId={mockUserId}
            />
        );

        // Unmount before fetch completes
        unmount();

        // Should not throw any errors
        expect(true).toBe(true);
    });
}); 