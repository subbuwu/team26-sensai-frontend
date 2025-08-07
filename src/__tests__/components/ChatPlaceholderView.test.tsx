import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPlaceholderView from '../../components/ChatPlaceholderView';

describe('ChatPlaceholderView Component', () => {
    // Common props for testing
    const baseProps = {
        taskType: 'quiz' as const,
        isChatHistoryLoaded: true,
        isTestMode: false,
        inputType: 'text',

    };

    it('should render a loading spinner when chat history is not loaded', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                isChatHistoryLoaded={false}
            />
        );

        // Check for spinner
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('should render quiz placeholder text when taskType is quiz', () => {
        render(<ChatPlaceholderView {...baseProps} />);

        expect(screen.getByText('Ready for a challenge?')).toBeInTheDocument();
        expect(screen.getByText(/Think through your answer, then type it here/)).toBeInTheDocument();
    });

    it('should render exam placeholder text when responseType is exam', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                responseType="exam"
            />
        );

        expect(screen.getByText('Ready to test your knowledge?')).toBeInTheDocument();
        expect(screen.getByText(/You can attempt the question only once/)).toBeInTheDocument();
    });

    it('should use correct wording for audio input type', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                inputType="audio"
            />
        );

        expect(screen.getByText(/Think through your answer, then record it here/)).toBeInTheDocument();
    });

    it('should show different message for coding question type in quiz mode', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                inputType="code"
            />
        );

        expect(screen.getByText(/Think through your answer, then write your code in the code editor/)).toBeInTheDocument();
        expect(screen.getByText(/You can also type your response below/)).toBeInTheDocument();
    });

    it('should show different message for coding question type in exam mode', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                inputType="code"
                responseType="exam"
            />
        );

        expect(screen.getByText(/Think through your answer carefully, then write your code in the code editor/)).toBeInTheDocument();
        expect(screen.getByText(/You can attempt the question only once/)).toBeInTheDocument();
    });

    it('should show view-only message when viewOnly is true', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                viewOnly={true}
            />
        );

        expect(screen.getByText('No activity yet')).toBeInTheDocument();
        expect(screen.getByText('There is no chat history for this quiz')).toBeInTheDocument();
    });

    it('should render learning material placeholder text when taskType is learning_material', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                taskType="learning_material"
            />
        );

        expect(screen.getByText('Have a question?')).toBeInTheDocument();
        expect(screen.getByText('Ask your doubt here and AI will help you understand the material better')).toBeInTheDocument();
    });

    it('should render view-only message for learning material when viewOnly is true', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                taskType="learning_material"
                viewOnly={true}
            />
        );

        expect(screen.getByText('No activity yet')).toBeInTheDocument();
        expect(screen.getByText('There is no chat history for this quiz')).toBeInTheDocument();
    });

    it('should handle test mode properly', () => {
        render(
            <ChatPlaceholderView
                {...baseProps}
                isTestMode={true}
                isChatHistoryLoaded={false}
            />
        );

        // Should not show loading spinner even if isChatHistoryLoaded is false because isTestMode is true
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();

        // Should show the placeholder content instead
        expect(screen.getByText('Ready for a challenge?')).toBeInTheDocument();
    });

    it('should render all input types correctly for exam mode', () => {
        // Test text input in exam mode
        const { unmount: unmountText } = render(
            <ChatPlaceholderView
                {...baseProps}
                responseType="exam"
            />
        );

        expect(screen.getByText(/Think through your answer carefully, then type it here/)).toBeInTheDocument();
        unmountText();

        // Test audio input in exam mode
        const { unmount: unmountAudio } = render(
            <ChatPlaceholderView
                {...baseProps}
                responseType="exam"
                inputType="audio"
            />
        );

        expect(screen.getByText(/Think through your answer carefully, then record it here/)).toBeInTheDocument();
        unmountAudio();

        // Test code input in exam mode
        render(
            <ChatPlaceholderView
                {...baseProps}
                responseType="exam"
                inputType="code"
            />
        );

        expect(screen.getByText(/Think through your answer carefully, then write your code in the code editor/)).toBeInTheDocument();
    });
}); 