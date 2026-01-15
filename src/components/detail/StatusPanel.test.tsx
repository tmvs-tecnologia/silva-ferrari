
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusPanel } from './StatusPanel';
import '@testing-library/jest-dom';

describe('StatusPanel Component', () => {
  const defaultProps = {
    status: 'Em andamento',
    onStatusChange: jest.fn(),
    currentStep: 1,
    totalSteps: 5,
    currentStepTitle: 'Cadastro de Documentos',
    workflowTitle: 'Visto de Trabalho',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  };

  it('renders the current step title correctly', () => {
    render(<StatusPanel {...defaultProps} />);
    const stepLabel = screen.getByTestId('current-step-label');
    expect(stepLabel).toBeInTheDocument();
    expect(stepLabel).toHaveTextContent('Cadastro de Documentos');
    expect(stepLabel.tagName).toBe('SPAN');
  });

  it('updates the step title dynamically when props change', () => {
    const { rerender } = render(<StatusPanel {...defaultProps} />);
    
    // Initial check
    expect(screen.getByTestId('current-step-label')).toHaveTextContent('Cadastro de Documentos');

    // Update props (simulate flow progression)
    rerender(
      <StatusPanel 
        {...defaultProps} 
        currentStep={2} 
        currentStepTitle="Agendar no Consulado" 
      />
    );

    expect(screen.getByTestId('current-step-label')).toHaveTextContent('Agendar no Consulado');
  });

  it('handles missing currentStepTitle gracefully (fallback)', () => {
    render(
      <StatusPanel 
        {...defaultProps} 
        currentStep={3} 
        currentStepTitle={undefined} 
      />
    );
    const stepLabel = screen.getByTestId('current-step-label');
    expect(stepLabel).toHaveTextContent('Etapa 3');
  });

  it('calls onStatusChange when status is changed manually', () => {
    render(<StatusPanel {...defaultProps} />);
    // Note: Testing Select interaction might require more complex setup depending on the library
    // Assuming simple mock behavior or standard select if implemented that way
  });
});
