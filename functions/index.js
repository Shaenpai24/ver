const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * Validate a user's answer to a quiz question
 * This function validates answers on the server to prevent client-side cheating
 */
exports.validateAnswer = functions.https.onCall(async (data, context) => {
  // 1. Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be logged in to submit answers'
    );
  }

  const { questionId, userAnswer } = data;

  // 2. Validate input
  if (!questionId || !userAnswer) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'questionId and userAnswer are required'
    );
  }

  const userId = context.auth.uid;
  const appId = 'default-app-id'; // This should match your app's appId

  console.log(`Validating answer for user ${userId}, question ${questionId}`);

  try {
    // 3. Get the question document with the correct answer
    // The correct answer is stored in a separate private collection
    const answerDocRef = db
      .collection('artifacts')
      .doc(appId)
      .collection('private')
      .collection('answers')
      .doc(questionId);

    const answerDoc = await answerDocRef.get();

    if (!answerDoc.exists) {
      // Fallback: Try to get from the public questions collection
      // This is for backward compatibility
      const questionDocRef = db
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .collection('data')
        .collection('questions')
        .doc(questionId);

      const questionDoc = await questionDocRef.get();
      
      if (!questionDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          `Question ${questionId} not found`
        );
      }

      const questionData = questionDoc.data();
      
      // Check if correctAnswer exists (for transition period)
      if (!questionData.correctAnswer) {
        throw new functions.https.HttpsError(
          'not-found',
          'Correct answer not available for this question'
        );
      }

      // Validate the answer
      const isCorrect = userAnswer.trim().toLowerCase() === 
                        questionData.correctAnswer.toLowerCase();

      // Update progress if correct
      if (isCorrect) {
        await updateUserProgress(
          userId,
          appId,
          questionId,
          questionData.nextQuestionId
        );

        // Log the attempt
        await logAnswerAttempt(userId, questionId, userAnswer, true);
      } else {
        // Log the failed attempt
        await logAnswerAttempt(userId, questionId, userAnswer, false);
      }

      return { 
        success: isCorrect,
        message: isCorrect ? 'Correct!' : 'Try again.'
      };
    }

    // 4. Get the correct answer from the private collection
    const correctAnswer = answerDoc.data().correctAnswer;
    
    // 5. Validate the user's answer
    const isCorrect = userAnswer.trim().toLowerCase() === 
                      correctAnswer.toLowerCase();

    // 6. Get question details for progress update
    const questionDocRef = db
      .collection('artifacts')
      .doc(appId)
      .collection('public')
      .collection('data')
      .collection('questions')
      .doc(questionId);

    const questionDoc = await questionDocRef.get();
    
    if (!questionDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Question metadata not found'
      );
    }

    const questionData = questionDoc.data();

    // 7. Update user progress if answer is correct
    if (isCorrect) {
      await updateUserProgress(
        userId,
        appId,
        questionId,
        questionData.nextQuestionId
      );

      console.log(`User ${userId} correctly answered question ${questionId}`);
    }

    // 8. Log the attempt for audit purposes
    await logAnswerAttempt(userId, questionId, userAnswer, isCorrect);

    // 9. Return result (don't expose the correct answer)
    return { 
      success: isCorrect,
      message: isCorrect ? 'Correct!' : 'Try again.'
    };

  } catch (error) {
    console.error('Error validating answer:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while validating the answer'
    );
  }
});

/**
 * Update user progress after correct answer
 */
async function updateUserProgress(userId, appId, questionId, nextQuestionId) {
  const updatePayload = {
    currentQuestion: nextQuestionId || null,
    [`partsSolved.${questionId}`]: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (nextQuestionId === null) {
    updatePayload.endTime = admin.firestore.FieldValue.serverTimestamp();
  }

  // Update both private and public user documents
  const privateRef = db
    .collection('artifacts')
    .doc(appId)
    .collection('users')
    .doc(userId);

  const publicRef = db
    .collection('artifacts')
    .doc(appId)
    .collection('public')
    .collection('data')
    .collection('teams')
    .doc(userId);

  const batch = db.batch();
  batch.update(privateRef, updatePayload);
  batch.update(publicRef, updatePayload);
  
  await batch.commit();
}

/**
 * Log answer attempts for audit purposes
 */
async function logAnswerAttempt(userId, questionId, userAnswer, isCorrect) {
  try {
    await db.collection('answer_attempts').add({
      userId,
      questionId,
      userAnswer,
      isCorrect,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Error logging answer attempt:', error);
  }
}
