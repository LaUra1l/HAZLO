document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const role = document.getElementById('role').value;
            console.log('Role selected:', role);

            const login = prompt('Wpisz hasło: ');
            if (checkLogin(role, login)) {
                // Sprawdź, czy użytkownik już istnieje i zaloguj
                fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'role': role
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Response data:', data);
                    if (data.message === 'Login successful!') {
                        window.location.href = '/'; // Przekierowanie po udanym logowaniu
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred: ' + error.message);
                });
            }
        });
    }

    function checkLogin(role, login) {
        const validLogins = {
            'user1': 'pau',
            'user2': 'federico'
        };
    
        if (validLogins[role] === login) {
            return true;
        } else {
            alert('Nieprawidłowe hasło.');
            return false;
        }
    }
});
