import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '@/components/ConfirmDialog.jsx';

describe('ConfirmDialog', () => {
    it('does not render content when closed', () => {
        render(
            <ConfirmDialog
                isOpen={false}
                onClose={() => {}}
                onConfirm={() => {}}
                title="Delete"
                message="Are you sure?"
            />
        );

        expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });

    it('renders title and message when open', () => {
        render(
            <ConfirmDialog
                isOpen
                onClose={() => {}}
                onConfirm={() => {}}
                title="Delete shop"
                message="This will permanently delete the shop."
            />
        );

        expect(screen.getByText('Delete shop')).toBeInTheDocument();
        expect(screen.getByText('This will permanently delete the shop.')).toBeInTheDocument();
    });

    it('renders custom confirm/cancel labels', () => {
        render(
            <ConfirmDialog
                isOpen
                onClose={() => {}}
                onConfirm={() => {}}
                title="Delete"
                message="Sure?"
                confirmText="Yes, delete"
                cancelText="Keep it"
            />
        );

        expect(screen.getByText('Yes, delete')).toBeInTheDocument();
        expect(screen.getByText('Keep it')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button clicked', () => {
        let confirmed = false;
        render(
            <ConfirmDialog
                isOpen
                onClose={() => {}}
                onConfirm={() => { confirmed = true; }}
                title="Delete shop"
                message="Sure?"
                confirmText="Confirm delete"
            />
        );

        fireEvent.click(screen.getByText('Confirm delete'));
        expect(confirmed).toBe(true);
    });

    it('calls onClose when cancel button clicked', () => {
        let closed = false;
        render(
            <ConfirmDialog
                isOpen
                onClose={() => { closed = true; }}
                onConfirm={() => {}}
                title="Delete"
                message="Sure?"
            />
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(closed).toBe(true);
    });

    it('shows loading state and disables confirm while loading', () => {
        render(
            <ConfirmDialog
                isOpen
                onClose={() => {}}
                onConfirm={() => {}}
                title="Delete"
                message="Sure?"
                loading
            />
        );

        const confirmButton = screen.getByText('Processing...');
        expect(confirmButton).toBeInTheDocument();
        expect(confirmButton).toBeDisabled();
    });
});
