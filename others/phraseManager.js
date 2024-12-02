// phraseManager.js
const fs = require('fs');
const path = require('path');

// Path to the JSON file storing phrases
const phrasesFilePath = path.join(__dirname, 'userPhrases.json');

// Function to load phrases from JSON file
function loadPhrases() {
    if (!fs.existsSync(phrasesFilePath)) {
        fs.writeFileSync(phrasesFilePath, JSON.stringify({}));
    }
    const data = fs.readFileSync(phrasesFilePath, 'utf-8');
    return JSON.parse(data);
}

// Function to save phrases to JSON file
function savePhrases(phrases) {
    fs.writeFileSync(phrasesFilePath, JSON.stringify(phrases, null, 2));
}

// Function to add or update a phrase
function addOrUpdatePhrase(codedPhrase, meaning) {
    const phrases = loadPhrases();
    phrases[codedPhrase.toLowerCase()] = meaning; // Add or update the phrase
    savePhrases(phrases);
    // console.log(`Phrase added: "${codedPhrase}" => "${meaning}"`);
}

// Function to read a phrase
function translatePhrase(codedPhrase) {
    const phrases = loadPhrases();
    return phrases[codedPhrase.toLowerCase()] || "Unknown code phrase";
}

module.exports = { addOrUpdatePhrase, translatePhrase };
