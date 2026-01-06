
import axios from 'axios';

type RegisterLoginParam = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dob: string;
    phoneNumber: string;
    confirmPassword: string;
    status:string;
    navigation: any
}

type LoginData = {
    phoneNumber: any,
    navigation: any
}


export const GetNewReleasedBookd = async() => {
    const response = await axios.post('http://localhost:3000/books/getNewReleasedBooks',{
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*"
        },
        timeout: 10000,
    });
}

export const loginHandler = async({phoneNumber,navigation}:LoginData) => {
    if(!phoneNumber){
        alert('Please enter valid phone number');
        return;
    }
    // Skip API call and navigate directly
    navigation.navigate('bottomTabs');
}

export const registerLoginAction = async ({email,password,firstName,lastName,dob,phoneNumber,confirmPassword,status,navigation}:RegisterLoginParam) => {
    
    const nameRegex = /^[A-Za-z]+$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!email || !password || !firstName || !lastName || !dob || !phoneNumber || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }
    if (!nameRegex.test(firstName)) {
        alert('First name must contain only alphabetic characters.');
        return;
    }
    if (!nameRegex.test(lastName)) {
        alert('Last name must contain only alphabetic characters.');
        return;
    }
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    if (!passwordRegex.test(password)) {
        alert('Password must be at least 8 characters long, and contain at least one letter and one number.');
        return;
    }

    if (status === 'register') {
        try {
            const data = {
                firstname: firstName,  // Change firstName to firstname
                lastname: lastName,    // Change lastName to lastname
                dob,
                email,
                phonenumber: phoneNumber,  // Change phoneNumber to phonenumber
                password,
            };
            console.log(data);
            const response = await axios.post('http://10.5.0.2:3000/user/', data,{
                headers: {
                    'Content-Type': 'application/json',
                    "Access-Control-Allow-Origin": "*"
                },
                timeout: 10000,
            });

            if (response.data.success) {
                alert(`Registration successful, welcome ${email}!`);
                navigation.navigate('bottomTabs');
            } else {
                alert(response.data.message || 'Registration failed');
            }
        } catch (error) {
            console.log(error);
            alert('An error occurred during registration' );
        }
    } else if (status === 'login') {
        try {
            const response = await axios.post('http://localhost:3000/login', {
                email,
                password
            });

            if (response.data.success) {
                alert(`Login successful, welcome back ${email}!`);
                navigation.navigate('bottomTabs');
            } else {
                alert(response.data.message || 'Login failed');
            }
        } catch (error) {
            alert('An error occurred during login');
        }
    }
}