const axios    = require('axios');
const FormData = require('form-data');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

const analyzeFace = async (imageBuffer, filename) => {
    const formData = new FormData();
    formData.append('file', imageBuffer, {
        filename:    filename,
        contentType: 'image/jpeg'
    });
    const response = await axios.post(
        `${PYTHON_API_URL}/analyze-face`,
        formData,
        { headers: formData.getHeaders() }
    );
    return response.data;
};
const generateSimulation = async (imageBuffer, filename, procedure) => {
    const formData = new FormData();
    formData.append('file', imageBuffer, {
        filename:    filename,
        contentType: 'image/jpeg'
    });
    formData.append('procedure', procedure);

    const response = await axios.post(
        `${PYTHON_API_URL}/generate-simulation`,
        formData,
        {
            headers: formData.getHeaders(),
            timeout: 600000  // 10 minutes
        }
    );
    return response.data;
};

module.exports = { analyzeFace, generateSimulation };