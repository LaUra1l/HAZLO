document.addEventListener('DOMContentLoaded', function() {
    const slides = [];
    const taskForm = document.getElementById('task-form');
    const tasksList = document.getElementById('tasks-list');

    if (taskForm) {
        taskForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const photo_url = document.getElementById('photo_url').value;

            // Get current date and time
            const date_get = new Date();
            const formattedDate = date_get.getFullYear() + '-' +
                                  ('0' + (date_get.getMonth() + 1)).slice(-2) + '-' +
                                  ('0' + date_get.getDate()).slice(-2) + ', ' +
                                  ('0' + date_get.getHours()).slice(-2) + ':' +
                                  ('0' + date_get.getMinutes()).slice(-2);

            console.log(formattedDate);

            const endline_date = document.getElementById('endline').value;

            fetch('/add_task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: title, description: description, photo_url: photo_url, date: formattedDate, endline: endline_date }),
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                fetchTasks(); // Refresh tasks list
            })
            .catch(error => console.error('Error:', error));
        });
    }

    function fetchTasks() {
        fetch('/tasks')
            .then(response => response.json())
            .then(tasks => {
                tasksList.innerHTML = '';
                tasks.forEach(task => {
                    console.log(task);
                   
                    const li = document.createElement('li');
                    li.innerHTML = `<i> DODANO: ${task.date}</i>`;
    
                    li.className = 'listElem';
                    li.innerHTML += `<p>TYTUŁ: ${task.title} <br> OPIS: ${task.description}</p>`;
    
                    li.innerHTML += `<p>CZAS WYKONANIA: ${task.endline.replace('T',', ')}</p>`;
    
                    const btn_contener = document.createElement('div');
                    btn_contener.className = 'btn_contener';
    
                    if (task.photo_url) {
                        const img = document.createElement('img');
                        img.src = task.photo_url;
                        img.alt = 'Task Image';
                        li.appendChild(img);
    
                        const validateBtn = document.createElement('button');
                        validateBtn.className = 'icon';
                        validateBtn.innerHTML = '<i class="fa-regular fa-thumbs-up" style="color: #119400;"></i>';
                        validateBtn.onclick = function() {
                            validateTask(task.id, true);
                        };
                        li.appendChild(validateBtn);
    
                        const rejectBtn = document.createElement('button');
                        rejectBtn.className = 'icon';
                        rejectBtn.innerHTML = '<i class="fa-regular fa-thumbs-up fa-rotate-180" style="color: #94000f;"></i>';
                        rejectBtn.onclick = function() {
                            validateTask(task.id, false);
                        };
    
                        btn_contener.appendChild(validateBtn);
                        btn_contener.appendChild(rejectBtn);
                    }

                    
                
                    li.innerHTML+=task.validated_date == null ? '' : `<br><i>${task.is_validated == 1 ? 'Zatwierdzono' : 'Odrzucono'}: ${task.validated_date}</i> <br>`

                    
                    li.appendChild(btn_contener);
                    tasksList.appendChild(li);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    function validateTask(taskId, isValid) {
        let message='';
        if(confirm("Czy masz jakieś uwagi do zadania?")){
            message=prompt('Wpisz wiadomość: ');
        }
        fetch(`/task/${taskId}/validate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_validated: isValid,validated_date:new Date().toLocaleString(),
            'message':message
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);

            
            fetchTasks(); // Refresh tasks list

           

           
        })
        .catch(error => console.error('Error:', error));
    }

    fetchTasks(); // Initial fetch

  
});
