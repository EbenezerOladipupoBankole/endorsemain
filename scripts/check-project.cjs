const axios = require('../functions/node_modules/axios');

async function checkProject() {
    const projectId = 'endorse-app';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)`;

    try {
        console.log(`Checking project ${projectId} via REST...`);
        const response = await axios.get(url);
        console.log('Project Info:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('REST Error:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

checkProject();
