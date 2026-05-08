const axios = require('axios');
const FormData = require('form-data');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

const analyzeFace = async (imageBuffer, filename) => {
    try {
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: filename,
            contentType: 'image/jpeg'
        });

        const response = await axios.post(
            `${PYTHON_API_URL}/analyze-face`,
            formData,
            { headers: formData.getHeaders() }
        );

        return response.data;
    } catch (error) {
        console.error('❌ Erreur FastAPI:', error.response?.data || error.message);
        throw error;
    }
};


module.exports = { analyzeFace };