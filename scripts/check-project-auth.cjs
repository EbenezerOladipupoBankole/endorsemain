const { GoogleAuth } = require('../functions/node_modules/google-auth-library');
const axios = require('../functions/node_modules/axios');
const path = require('path');

async function checkProject() {
    const keyPath = path.join(__dirname, 'service-account-key.json');
    const auth = new GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const projectId = '661681554342';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;

    try {
        console.log(`Listing databases for project ${projectId}...`);
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token.token}` }
        });
        console.log('Databases:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('REST Error:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

checkProject();
