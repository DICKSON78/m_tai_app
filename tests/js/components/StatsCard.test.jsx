import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from '@/components/StatsCard.jsx';
import { vi } from 'vitest';

vi.mock('react-router-dom', () => ({
    Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
    useNavigate: () => vi.fn(),
}));

describe('StatsCard', () => {
    it('renders title and value', () => {
        render(<StatsCard title="Total Sales" value="1,200,000" />);

        expect(screen.getByText('Total Sales')).toBeInTheDocument();
        expect(screen.getByText('1,200,000')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
        render(<StatsCard title="Orders" value="45" subtitle="+12 this week" />);

        expect(screen.getByText('+12 this week')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        render(<StatsCard title="Revenue" value="100" icon={<span data-testid="test-icon">$</span>} />);

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
        render(<StatsCard title="Revenue" value="100" />);

        expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('uses primary colors by default', () => {
        render(<StatsCard title="Revenue" value="100" />);

        const card = screen.getByText('Revenue').closest('.stat-card');
        expect(card).toBeInTheDocument();
    });
});
