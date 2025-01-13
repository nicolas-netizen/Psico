import React, { useState, useEffect } from 'react';
import { Test, TestQuestion, QuestionType, UserAnswer } from '../types/Test';
import { useGlobalAuth } from '../hooks/useGlobalAuth';

interface InteractiveTestProps {
  test: Test;
  onSubmit: (answers: UserAnswer[]) => void;
}

export const InteractiveTest: React.FC<InteractiveTestProps> = ({ test, onSubmit }) => {
  const { user } = useGlobalAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(test.timeLimit || 30);

  useEffect(() => {
    console.log('Test iniciado:', test);
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Cada minuto

    return () => {
      console.log('Limpiando timer del test');
      clearInterval(timer);
    };
  }, [test]);

  const handleAnswerChange = (questionId: string, selectedOption?: string, openAnswer?: string) => {
    console.log('Respondiendo pregunta:', { questionId, selectedOption, openAnswer });
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);
    
    if (existingAnswerIndex !== -1) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = { questionId, selectedOption, openAnswer };
      setAnswers(updatedAnswers);
    } else {
      setAnswers([...answers, { questionId, selectedOption, openAnswer }]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    if (!user) {
      console.error('No hay usuario autenticado');
      return;
    }
    
    console.log('Enviando respuestas:', answers);
    onSubmit(answers);
  };

  const renderQuestionByType = (question: TestQuestion) => {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div>
            {question.options?.map(option => (
              <label key={option.id}>
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={answers.find(a => a.questionId === question.id)?.selectedOption === option.id}
                  onChange={() => handleAnswerChange(question.id, option.id)}
                />
                {option.text}
              </label>
            ))}
          </div>
        );
      
      case QuestionType.TRUE_FALSE:
        return (
          <div>
            <label>
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={answers.find(a => a.questionId === question.id)?.selectedOption === 'true'}
                onChange={() => handleAnswerChange(question.id, 'true')}
              />
              Verdadero
            </label>
            <label>
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={answers.find(a => a.questionId === question.id)?.selectedOption === 'false'}
                onChange={() => handleAnswerChange(question.id, 'false')}
              />
              Falso
            </label>
          </div>
        );
      
      case QuestionType.OPEN_ANSWER:
        return (
          <textarea
            placeholder="Escribe tu respuesta aquí"
            value={answers.find(a => a.questionId === question.id)?.openAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, undefined, e.target.value)}
          />
        );
      
      default:
        return <div>Tipo de pregunta no soportado</div>;
    }
  };

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <div className="interactive-test">
      <div className="test-header">
        <h2>{test.name}</h2>
        <p>Tiempo restante: {timeRemaining} minutos</p>
      </div>

      <div className="question-container">
        <h3>Pregunta {currentQuestionIndex + 1} de {test.questions.length}</h3>
        <p>{currentQuestion.text}</p>
        {renderQuestionByType(currentQuestion)}
      </div>

      <div className="test-navigation">
        <button 
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Anterior
        </button>
        
        {currentQuestionIndex === test.questions.length - 1 ? (
          <button 
            onClick={handleSubmitTest}
            className="submit-test-btn"
          >
            Finalizar Test
          </button>
        ) : (
          <button 
            onClick={handleNextQuestion}
            className="next-question-btn"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
};
