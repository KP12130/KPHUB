// Basic English/Hungarian Profanity Filter

const badWords = [
    // English
    'fuck', 'fucking', 'fucker', 'shit', 'shitty', 'bitch', 'bitches',
    'asshole', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'bastard', 'nigger', 'nigga', 'faggot', 'retard',

    // Hungarian
    'kurva', 'bazmeg', 'basz', 'baszni', 'fasz', 'faszfej', 'geci',
    'segg', 'seggfej', 'szar', 'buzi', 'cigány', 'picsa', 'ribanc', 'ringyó', 'köcsög'
];

/**
 * Sweeps a string for profanity and replaces bad words with asterisks.
 * @param {string} text - The input string to filter.
 * @returns {string} - The filtered string.
 */
function filterProfanity(text) {
    if (!text) return text;

    let filteredText = text;

    badWords.forEach(word => {
        // Create a regex to match the bad word ignoring case
        // Bound by word boundaries to prevent catching things like "fascinating"
        // Also catching common character replacements could go here in a more advanced filter
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });

    return filteredText;
}

/**
 * Checks if a string contains profanity.
 * @param {string} text 
 * @returns {boolean} true if profanity is detected
 */
function hasProfanity(text) {
    if (!text) return false;

    // Convert text to lowercase for easier matching
    const lowerText = text.toLowerCase();

    // Check against bad words
    // We use match with regex to respect word boundaries
    for (const word of badWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lowerText)) {
            return true;
        }
    }

    return false;
}

module.exports = {
    filterProfanity,
    hasProfanity
};
