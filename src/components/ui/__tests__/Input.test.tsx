import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with different types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello World');

    expect(handleChange).toHaveBeenCalledTimes(11); // 11 characters including spaces
    expect(input).toHaveValue('Hello World');
  });

  it('displays placeholder text', () => {
    render(<Input placeholder="Enter your name" />);

    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('handles disabled state', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Input disabled onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();

    await user.type(input, 'test');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} />);

    expect(ref).toHaveBeenCalled();
  });

  it('passes through additional props', () => {
    render(<Input data-testid="custom-input" maxLength={10} />);

    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('handles controlled value', () => {
    const handleChange = jest.fn();
    const { rerender } = render(<Input value="initial" onChange={handleChange} />);

    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(<Input value="updated" onChange={handleChange} />);
    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
  });
});