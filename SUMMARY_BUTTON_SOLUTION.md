# Summary Button Issue - Solution

## The Issue
The Summary button appears to "not work" because it's **disabled by default** and only becomes functional under specific conditions.

## Root Cause
The Summary button is designed to generate **personalized summaries for specific people**. It only works when:

1. ✅ You have added people to your diary
2. ✅ You have diary entries that mention those people  
3. ✅ You have selected a specific person from the person filter dropdown

## Current Behavior (By Design)
- **When "All People" is selected**: Button shows "Select Person First" and is disabled
- **When a specific person is selected**: Button shows "Share Summary" and is enabled

## How to Fix/Use the Summary Button

### Step 1: Add People to Your Diary
1. Go to the diary view
2. Click the **Users icon** (👥) in the top-right corner
3. Click "Add Person" and fill in their details
4. Save the person profile

### Step 2: Create Entries That Mention People
1. Create diary entries that include people in the "people" field
2. Make sure the person's name appears in your entries
3. You need at least a few entries about the same person for a meaningful summary

### Step 3: Select the Person
1. In the diary view, find the **person filter dropdown** (shows "All People" by default)
2. Select the specific person you want a summary for
3. The Summary button will now be **enabled** and show "Share Summary"

### Step 4: Generate Summary
1. Click the now-enabled Summary button
2. The app will generate a personalized summary using AI
3. You can download it as an image or copy the text

## Quick Test
Run this in your browser console to add sample data:

```javascript
// Add sample person
const person = {
    id: 'test-' + Date.now(),
    name: 'Alice',
    relation: 'Friend'
};
const people = JSON.parse(localStorage.getItem('glimmer_people') || '[]');
people.push(person);
localStorage.setItem('glimmer_people', JSON.stringify(people));

// Add sample entry
const entry = {
    id: 'entry-' + Date.now(),
    timestamp: Date.now(),
    type: 'POSITIVE',
    emotion: 'HAPPY',
    text: 'Had a great time with Alice today',
    summary: 'Fun day with Alice',
    people: ['Alice'],
    reason: 'Alice made me laugh',
    reaction: 'Felt happy and grateful'
};
const entries = JSON.parse(localStorage.getItem('glimmer_entries') || '[]');
entries.unshift(entry);
localStorage.setItem('glimmer_entries', JSON.stringify(entries));

console.log('✅ Sample data added! Now select "Alice" from the person filter.');
```

## Summary
The Summary button **is working correctly**. It's a feature that requires:
- People management (adding people to your diary)
- Entries that mention those people
- Selecting a specific person to generate a summary for

This design makes sense because the feature generates personalized summaries about your relationship with specific people, not general summaries of all your thoughts.