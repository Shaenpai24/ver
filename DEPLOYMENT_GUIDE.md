# Security Fix Deployment Guide

This guide walks you through deploying the security fixes to prevent answer extraction.

## ✅ What Was Fixed

1. **Removed client-side validation** - Answers are now validated server-side
2. **Created Cloud Function** - Server-side answer validation in `functions/index.js`
3. **Added Firestore security rules** - Prevents clients from reading correct answers
4. **Updated client code** - Now calls Cloud Function instead of local validation

## 🚀 Deployment Steps

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Login to Firebase:

```bash
firebase login
```

### Step 2: Initialize Firebase Functions (if not already done)

```bash
cd escape-room-app
firebase init functions
```

Select:
- Use an existing project: `escape-1a6de`
- Language: JavaScript
- ESLint: Yes
- Install dependencies: Yes

### Step 3: Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 4: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

This deploys the security rules from `firestore.rules`

### Step 5: Deploy Cloud Function

```bash
firebase deploy --only functions
```

This deploys the `validateAnswer` Cloud Function.

### Step 6: Update Question Data

You need to separate the correct answers from the public question documents.

**Option A: Manual Separation (Quick Fix)**

1. For each question, remove the `correctAnswer` field from public documents
2. Create a new private collection: `artifacts/{appId}/private/answers/{questionId}`
3. Store only the correct answer there

**Option B: Script Migration (Recommended)**

Create a migration script:

```javascript
// migrate-answers.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function migrateAnswers() {
  const appId = 'default-app-id';
  const questionsRef = db
    .collection('artifacts')
    .doc(appId)
    .collection('public')
    .collection('data')
    .collection('questions');

  const questions = await questionsRef.get();
  
  const batch = db.batch();
  
  questions.forEach(doc => {
    const data = doc.data();
    if (data.correctAnswer) {
      // Copy correct answer to private collection
      const answerRef = db
        .collection('artifacts')
        .doc(appId)
        .collection('private')
        .collection('answers')
        .doc(doc.id);
      
      batch.set(answerRef, { 
        correctAnswer: data.correctAnswer 
      });
      
      // Remove correct answer from public document
      const questionRef = questionsRef.doc(doc.id);
      batch.update(questionRef, {
        correctAnswer: admin.firestore.FieldValue.delete()
      });
    }
  });
  
  await batch.commit();
  console.log('Migration complete!');
}

migrateAnswers().catch(console.error);
```

Run the migration:

```bash
node migrate-answers.js
```

### Step 7: Update Admin Upload Logic

Modify the admin question upload to exclude `correctAnswer`:

```javascript
// In your admin upload handler
const questionsData = JSON.parse(e.target.result);
const batch = db.batch();

questionsData.questions.forEach((q) => {
  const { correctAnswer, ...publicData } = q; // Separate correctAnswer
  
  // Upload public question data (without answer)
  const qRef = questionsCollectionRef.doc(q.id);
  batch.set(qRef, publicData);
  
  // Store correct answer separately
  if (correctAnswer) {
    const answerRef = privateAnswersCollectionRef.doc(q.id);
    batch.set(answerRef, { correctAnswer });
  }
});

await batch.commit();
```

### Step 8: Test the Deployment

1. **Deploy the updated client code** (already done)
2. **Test answer submission** - It should now call the Cloud Function
3. **Verify answers are NOT in Network tab** - Check DevTools
4. **Test that correct answers work** - Submit correct answers
5. **Test that wrong answers are rejected** - Submit wrong answers

## 🔍 Verification Checklist

- [ ] Firestore rules deployed successfully
- [ ] Cloud Function deployed successfully  
- [ ] Answer attempts are logged in `answer_attempts` collection
- [ ] Network tab shows NO `correctAnswer` field in responses
- [ ] Correct answers submit successfully
- [ ] Incorrect answers are rejected
- [ ] DevTools breakpoint attack no longer reveals answers

## 🐛 Troubleshooting

### Cloud Function not found error

**Error:** `functions/not-found` when submitting answers

**Solution:**
1. Verify function is deployed: `firebase functions:list`
2. Check function logs: `firebase functions:log`
3. Redeploy if needed: `firebase deploy --only functions`

### Security rules too restrictive

**Error:** Permission denied when reading questions

**Solution:**
1. Verify user is authenticated
2. Check Firestore rules allow read access
3. Update rules if needed: `firebase deploy --only firestore:rules`

### Correct answers still exposed

**Error:** Can still see answers in Network tab

**Solution:**
1. Verify migration removed `correctAnswer` from public documents
2. Check Firestore console - public questions should NOT have `correctAnswer`
3. Clear browser cache and test again

## 📊 Monitoring

After deployment, monitor:

1. **Cloud Function logs:** `firebase functions:log --only validateAnswer`
2. **Answer attempts:** Check `answer_attempts` collection in Firestore
3. **Function invocations:** Monitor in Firebase Console
4. **Error rates:** Check for failed validations

## 🔄 Rollback Plan

If something goes wrong:

1. **Revert client code** - Restore previous version of `App.jsx`
2. **Disable Cloud Function** - Comment out the function call
3. **Restore old security rules** - Deploy previous rules

## 📝 Post-Deployment Tasks

1. **Update documentation** - Document the new architecture
2. **Train team** - Ensure everyone understands the changes
3. **Set up monitoring** - Create alerts for failed validations
4. **Security audit** - Schedule regular security reviews

## 🎉 Success Criteria

The deployment is successful when:

✅ No `correctAnswer` fields are visible in browser DevTools  
✅ Answers are validated on the server  
✅ All answer attempts are logged  
✅ Users cannot extract answers using any client-side method  
✅ Application functionality remains unchanged for legitimate users  

---

**Need Help?** Contact the development team or check the main documentation.
