const { connectToDatabase } = require('./mongo');
const { encryptData, decryptData } = require('../utils/encryption');
const fs = require('fs');

async function insertEncryptedData(filePath, collectionName) {
    const db = await connectToDatabase();
    const collection = db.collection(collectionName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const encryptedData = data.map(doc => {
        const encryptedDoc = encryptData(JSON.stringify(doc));
        return { encryptedData: encryptedDoc.encryptedData, iv: encryptedDoc.iv };
    });

    await collection.deleteMany({});
    const result = await collection.insertMany(encryptedData);
    console.log(`${result.insertedCount} documents inserted.`);
}

module.exports = { insertEncryptedData };
