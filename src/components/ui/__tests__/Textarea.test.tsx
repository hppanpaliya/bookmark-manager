import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('renders with default props', () => {
    render(<Textarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello World');

    expect(handleChange).toHaveBeenCalledTimes(11);
    expect(textarea).toHaveValue('Hello World');
  });

  it('displays placeholder text', () => {
    render(<Textarea placeholder="Enter description" />);

    const textarea = screen.getByPlaceholderText('Enter description');
    expect(textarea).toBeInTheDocument();
  });

  it('handles disabled state', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Textarea disabled onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();

    await user.type(textarea, 'test');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Textarea ref={ref} />);

    expect(ref).toHaveBeenCalled();
  });

  it('passes through additional props', () => {
    render(<Textarea data-testid="custom-textarea" rows={5} maxLength={100} />);

    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('handles controlled value', () => {
    const handleChange = jest.fn();
    const { rerender } = render(<Textarea value="initial text" onChange={handleChange} />);

    expect(screen.getByDisplayValue('initial text')).toBeInTheDocument();

    rerender(<Textarea value="updated text" onChange={handleChange} />);
    expect(screen.getByDisplayValue('updated text')).toBeInTheDocument();
  });

  it('respects min and max height constraints', () => {
    render(<Textarea style={{ minHeight: '120px', maxHeight: '200px' }} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveStyle({ minHeight: '120px', maxHeight: '200px' });
  });
});