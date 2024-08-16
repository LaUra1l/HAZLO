// user2.js
document.addEventListener('DOMContentLoaded', function() {
    fetchTasks();

    function fetchTasks() {
        fetch('/tasks')
            .then(response => response.json())
            .then(tasks => {
                const tasksList = document.getElementById('tasks-list');
                tasksList.innerHTML = '';
                tasks.forEach(task => {
                    const li = document.createElement('li');
                    li.className='listElem'
                    li.innerHTML = `<p>TYTUŁ: ${' ',task.title} <br> OPIS: ${' ' ,task.description} <br> ZATWIERDZONY: ${task.is_validated == 1 ? '<i class="fa-regular fa-thumbs-up icon" style="color: #119400;"></i>' : '<i class="fa-regular fa-thumbs-up fa-rotate-180 icon" style="color: #94000f;"></i>'} </p>`;

                    li.innerHTML+=`<p>CZAS WYKONANIA: ${task.endline.replace('T',', ')} </p>`

                    //  li.innerHTML+=`<p>DODANO ZDJĘCIE: ${task.endline.replace('T',', ')} </p>`



                    


                    if (task.photo_url) {
                        const img = document.createElement('img');
                        img.src = task.photo_url;
                        img.alt = 'Task Image';
                        li.appendChild(img);
                    }
                    console.log(task)
                    // Add photo upload form
                    const form = document.createElement('form');
                    form.enctype = 'multipart/form-data';
                    form.innerHTML = `
                        <input type="file" id="file-${task.id}" required>
                        <input type="hidden" id="task_id-${task.id}" value="${task.id}">
                        <button class='buttonDesign' type="submit">DODAJ ZDJĘCIE</button>
                    `;

                    
                    form.addEventListener('submit', function(event) {
                        event.preventDefault();
                        uploadPhoto(task.id);
                    });

                     li.innerHTML+=task.validated_date == null ? '' : `<br><p>Zleceniodawca ${task.is_validated == 1 ? 'zatwierdził' : 'odrzucił'} ${task.validated_date.replace(',',' o ')}</p> <br>`

                    li.appendChild(form);
                    tasksList.appendChild(li);
                });
            });
    }

    function uploadPhoto(taskId) {
        const fileInput = document.getElementById(`file-${taskId}`);
        const taskIdInput = document.getElementById(`task_id-${taskId}`);
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('task_id', taskIdInput.value);

        fetch(`/task/${taskId}/upload_image`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchTasks(); // Refresh tasks list
        })
        .catch(error => console.error('Error:', error));
    }
});
