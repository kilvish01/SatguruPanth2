import axios from 'axios';

const API_URL = 'http://10.232.58.83:3000/api';

export const GetAllBooks = async () : Promise<any[]> => {
    try{
        const response = await axios.get(`${API_URL}/books`, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        })
        return response.data;
    } catch (error) {
        console.error('Error fetching all books:', error);
        return [];
    }
}
