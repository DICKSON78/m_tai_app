import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/Modal.jsx';

describe('Modal', () => {
    it('does not render content when closed', () => {
        render(<Modal isOpen={false} onClose={() => {}} title="Edit">Body</Modal>);

        expect(screen.queryByText('Body')).not.toBeInTheDocument();
    });

    it('renders title and children when open', () => {
        render(<Modal isOpen onClose={() => {}} title="Edit shop">Form body here</Modal>);

        expect(screen.getByText('Edit shop')).toBeInTheDocument();
        expect(screen.getByText('Form body here')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(
            <Modal isOpen onClose={() => {}} title="Edit" description="Update shop details">
                Body
            </Modal>
        );

        expect(screen.getByText('Update shop details')).toBeInTheDocument();
    });

    it('calls onClose when Escape is pressed', () => {
        let closed = false;
        render(<Modal isOpen onClose={() => { closed = true; }} title="Edit">Body</Modal>);

        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(closed).toBe(true);
    });
});
