const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const QUESTIONS_FILE = path.join(__dirname, '../questions.json');
const TEST_RESULTS_FILE = path.join(__dirname, '../test_results.json');

class TestService {
  static readQuestions() {
    try {
      return JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
    } catch (error) {
      console.error('Error reading questions:', error);
      return [];
    }
  }

  static generateTest(configuration) {
    const allQuestions = this.readQuestions();
    const selectedQuestions = [];

    // Validate configuration
    if (!configuration || !configuration.requiredCategories) {
      throw new Error('Invalid test configuration');
    }

    // Distribute questions by category
    configuration.requiredCategories.forEach(category => {
      const categoryQuestions = allQuestions.filter(q => 
        q.category === category && q.isActive
      );

      if (categoryQuestions.length === 0) {
        console.warn(`No active questions found for category: ${category}`);
        return; // Skip this category if no questions
      }

      const minQuestions = configuration.questionDistribution?.[category]?.minQuestions || 1;
      const maxQuestions = configuration.questionDistribution?.[category]?.maxQuestions || 3;

      const randomQuestions = this.selectRandomQuestions(
        categoryQuestions, 
        minQuestions, 
        maxQuestions
      );

      selectedQuestions.push(...randomQuestions);
    });

    // Ensure we have at least some questions
    if (selectedQuestions.length === 0) {
      throw new Error('Could not generate test: No questions available');
    }

    return {
      id: uuidv4(),
      title: configuration.name || 'Generated Test',
      questions: selectedQuestions,
      configuration,
      timeLimit: configuration.timeLimit || 30,
      createdAt: new Date().toISOString()
    };
  }

  static selectRandomQuestions(questions, min, max) {
    // Shuffle the questions
    const shuffled = questions.sort(() => 0.5 - Math.random());
    
    // Ensure we don't exceed available questions
    const numQuestions = Math.min(
      Math.max(min, 1), 
      Math.min(max, questions.length)
    );

    return shuffled.slice(0, numQuestions);
  }

  static calculateTestScore(test, userAnswers) {
    const scoreWeights = test.configuration.scoreWeights;
    let totalScore = 0;
    let correctAnswers = 0;
    const categoryPerformance = {};

    test.questions.forEach(question => {
      const userAnswer = userAnswers.find(a => a.questionId === question.id);
      const isCorrect = this.checkAnswer(question, userAnswer);

      // Find score weight for this question
      const weightConfig = scoreWeights.find(w => 
        w.category === question.category
      );

      const basePoints = weightConfig?.basePoints || 1;
      const difficultyMultiplier = weightConfig?.difficultyMultiplier[question.difficulty] || 1;
      const questionScore = basePoints * difficultyMultiplier;

      if (isCorrect) {
        totalScore += questionScore;
        correctAnswers++;

        // Update category performance
        if (!categoryPerformance[question.category]) {
          categoryPerformance[question.category] = {
            correctAnswers: 0,
            totalQuestions: 0,
            score: 0,
            percentageScore: 0
          };
        }
        categoryPerformance[question.category].correctAnswers++;
        categoryPerformance[question.category].score += questionScore;
      }

      // Track total questions per category
      if (!categoryPerformance[question.category]) {
        categoryPerformance[question.category] = {
          correctAnswers: 0,
          totalQuestions: 0,
          score: 0,
          percentageScore: 0
        };
      }
      categoryPerformance[question.category].totalQuestions++;
    });

    // Calculate percentage scores for categories
    Object.keys(categoryPerformance).forEach(category => {
      const catPerf = categoryPerformance[category];
      catPerf.percentageScore = (catPerf.correctAnswers / catPerf.totalQuestions) * 100;
    });

    // Determine strengths and weaknesses
    const strengths = Object.entries(categoryPerformance)
      .filter(([_, perf]) => perf.percentageScore >= 75)
      .map(([category, _]) => category);

    const weaknesses = Object.entries(categoryPerformance)
      .filter(([_, perf]) => perf.percentageScore < 50)
      .map(([category, _]) => category);

    return {
      testId: test.id,
      score: totalScore,
      percentageScore: (correctAnswers / test.questions.length) * 100,
      totalQuestions: test.questions.length,
      correctAnswers,
      categoryPerformance,
      strengths,
      weaknesses
    };
  }

  static checkAnswer(question, userAnswer) {
    if (!userAnswer) return false;

    switch(question.type) {
      case 'multiple_choice':
        return question.options
          .find(opt => opt.isCorrect)?.id === userAnswer.selectedOption;
      
      case 'true_false':
        return question.correctAnswer === userAnswer.selectedOption;
      
      case 'open_answer':
        // Implement fuzzy matching or AI-based answer checking
        return userAnswer.openAnswer?.toLowerCase() === question.correctAnswer?.toLowerCase();
      
      default:
        return false;
    }
  }
}

module.exports = TestService;
