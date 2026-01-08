/* eslint-env jest */
import { render, screen } from '@testing-library/react';
import Loading from '../../src/components/ui/Loading';

describe('Loading Component', () => {
  test('renders loading spinner', () => {
    render(<Loading />);
    const loadingElement = screen.getByRole('progressbar');
    expect(loadingElement).toBeInTheDocument();
  });

  test('renders with custom message', () => {
    const message = 'Custom loading message';
    render(<Loading message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  test('renders default message when no message provided', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
