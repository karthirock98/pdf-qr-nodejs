// URL-encoded string
const urlEncodedString = 'MlBnWUhscndLN0ZYN3U0R0dBTGE3Zz09%3D';

// Step 1: Decode the URL-encoded string
const decodedString = decodeURIComponent(urlEncodedString);

// Step 2: Convert the decoded string to base64
const base64EncodedString = Buffer.from(decodedString, 'binary').toString('base64');

console.log('Decoded URL-encoded string:', decodedString);
console.log('Base64-encoded string:', base64EncodedString);
