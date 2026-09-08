import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '@/components/Pagination.jsx';

describe('Pagination', () => {
    it('returns null when lastPage is 1 or less', () => {
        const { container } = render(<Pagination currentPage={1} lastPage={1} onPageChange={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders windowed page buttons with ellipsis', () => {
        render(<Pagination currentPage={1} lastPage={5} onPageChange={() => {}} />);

        for (const page of [1, 2, 3, 5]) {
            expect(screen.getByText(String(page))).toBeInTheDocument();
        }
        // page 4 is elided for currentPage=1
        expect(screen.queryByText('4')).not.toBeInTheDocument();
        expect(screen.getByText('…')).toBeInTheDocument();
    });

    it('calls onPageChange with selected page', () => {
        let called = null;
        const handler = (page) => { called = page; };

        render(<Pagination currentPage={3} lastPage={5} onPageChange={handler} />);

        fireEvent.click(screen.getByText('4'));
        expect(called).toBe(4);
    });

    it('disables previous button on first page', () => {
        render(<Pagination currentPage={1} lastPage={5} onPageChange={() => {}} />);

        const prevButton = screen.getAllByRole('button')[0];
        expect(prevButton).toBeDisabled();
        expect(prevButton).toHaveTextContent('‹');
    });

    it('disables next button on last page', () => {
        render(<Pagination currentPage={5} lastPage={5} onPageChange={() => {}} />);

        const nextButton = screen.getAllByRole('button').at(-1);
        expect(nextButton).toBeDisabled();
    });

    it('navigates prev/next via arrow buttons', () => {
        const calls = [];
        const handler = (page) => calls.push(page);

        render(<Pagination currentPage={3} lastPage={5} onPageChange={handler} />);

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // prev
        expect(calls.at(-1)).toBe(2);

        fireEvent.click(buttons.at(-1)); // next
        expect(calls.at(-1)).toBe(4);
    });
});
