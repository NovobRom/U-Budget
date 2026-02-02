import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple component for testing configuration
const Hello = () => <h1>Hello World</h1>;

describe('Vitest Setup', () => {
    it('runs simple assertions', () => {
        expect(1 + 1).toBe(2);
    });

    it('renders components', () => {
        render(<Hello />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
});
