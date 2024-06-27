
//--------------------Listar tarefas------------------


function fetchTasks() {
    fetch('/todosData')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            return response.json();
        })
        .then(tasks => {
            displayTasks(tasks);
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}

function displayTasks(tasks) {

    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="alert alert-primary alert-dismissible fade show mt-3" role="alert">
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                <strong>Warning!</strong> There are no tasks.
            </div>
        `;
    } else {
        tasks.forEach(task => {
            const priorityBadge = task.priority === 'High' ? '<span class="badge bg-danger">High</span>' :
                                 task.priority === 'Medium' ? '<span class="badge bg-warning text-dark">Medium</span>' :
                                 '<span class="badge bg-success">Low</span>';

            const li = document.createElement('li');
            li.classList.add('list-group-item', 'mb-2');
            li.innerHTML = `
                <span class="${task.completed ? 'completed' : ''} description">${task.description}</span>
                ${priorityBadge}
                <button type="button" class="btn btn-outline-primary btn-sm mx-3" data-bs-toggle="modal" data-bs-target="#editTaskModal" onclick="fillEditForm(${task.id}, '${task.description}', '${task.priority}')">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <div class="btn-group task-btn-group"> 
                    <button type="button" class="btn btn-outline-success mx-1" onclick="completeTask(${task.id})" ><i class="bi bi-check-all"></i></button>
                    <button type="button" class="btn btn-outline-warning mx-1" onclick="incompleteTask(${task.id})" ><i class="bi bi-arrow-counterclockwise"></i></button>
                    <button type="button" class="btn btn-danger mx-1" onclick="deleteTask(${task.id})" ><i class="bi bi-x"></i></button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }
}


document.addEventListener('DOMContentLoaded', () => {

    fetchTasks();

    displayUsername();

    getDashboardData();

    document.getElementById('priority-filter').addEventListener('change', function() {
        const priority = this.value;
        filterTasks(priority);
    });

    document.getElementById('sort-filter').addEventListener('change', function() {
        const sort = this.value;

        if (sort === '') {
            fetchTasks();
            Swal.fire({
                position: 'top-start',
                icon: 'success',
                title: 'Task sort option <strong>removed</strong>!',
                toast: true,
                showConfirmButton: false,
                timer: 1350,
                timerProgressBar: true,
                hideClass: {
                    popup: 'animate__animated animate__fadeOut animate__faster'
                }
            });
        } else {
            sortTasks(sort);
        }   
    })
    
    document.getElementById('searchFilter').addEventListener('submit', function(event) {
        event.preventDefault();
        const search = document.getElementById('searchInput').value;
        searchTasks(search);
    });

    document.getElementById('clearSearch').addEventListener('click',function(event) {
        event.preventDefault();
        fetchTasks();
        Swal.fire({
            position: 'top',
            icon: 'success',
            title: 'Tasks search set off!',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
        })
    });

    document.getElementById('editTaskForm').addEventListener('submit', function(event) {
        event.preventDefault(); 
    
        const id = document.getElementById('task-id').value;
        const newDescription = document.getElementById('newDescription').value;
        const newPriority = document.getElementById('newPriority').value;
    
        editTask(id, newDescription, newPriority);
    });

});



//----------------------Criar tarefa-------------------
document.getElementById('task-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const description = document.getElementById('description').value;
    const priority = document.getElementById('priority').value;
    
    createTask(description, priority);
});

function createTask(description, priority) {
    fetch('/todos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description, priority })
    })
    .then(response => response.json())
    .then(task => {
        fetchTasks();
        Swal.fire({
            position: 'top-start',
            icon: 'success',
            title: 'Task added!',
            toast: true,
            showConfirmButton: false,
            timer: 1350,
            timerProgressBar: true,
            hideClass: {
                popup: 'animate__animated animate__fadeOut animate__faster'
            }
        });
        document.getElementById('description').value = '';
    })
}

//----------------------Registo---------------------

//Na página do registo como script (Só funciona se meter os scripts nas páginas)

//------------------Login------------------------

//Na página do login como script 

//----------------------Display de username---------------------

function displayUsername() {
    fetch('/username')
        .then(response => response.json())
        .then(data => {
            const username = data.username;
            document.getElementById('usernameDisplay').innerHTML = `<strong>User:</strong> <i class="bi bi-person-circle"></i> ${username}`;
        })
}

//------------------------Editar tarefa-------------------------

function fillEditForm(id, description, priority) {
    document.getElementById('task-id').value = id;
    document.getElementById('newDescription').value = description;
    document.getElementById('newPriority').value = priority;
}

function editTask(id, newDescription, newPriority) {
    //Swal para pop-up com form? (Retirar modal de edit?)
    fetch(`/todos/${id}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ editDescription: newDescription, editPriority: newPriority })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        return response.json();
    })
    .then(() => {
        fetchTasks();
        let modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
        modal.hide();
        Swal.fire({
            title: 'Task Updated!',
            icon: 'success'
        })
    })
    .catch(error => {
        console.error('Error updating task:', error);
    });
}

//-----------------------Completar tarefa-------------------

function completeTask(id) {
    fetch(`/todos/${id}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(() => {
        fetchTasks();
        Swal.fire({
            position: 'top-start',
            icon: 'success',
            title: 'Task set as complete!',
            toast: true,
            showConfirmButton: false,
            timer: 1350,
            timerProgressBar: true,
            hideClass: {
                popup: 'animate__animated animate__fadeOut animate__faster'
            }
        });
    })
}

//-------------------Incompletar tarefa---------------

function incompleteTask(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Set the task back in progress?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, recover task!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/todos/${id}/notcomplete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
                .then(response => response.json())
                .then(tasks => {
                    fetchTasks(tasks);
                    Swal.fire({
                        position: 'top-start',
                        icon: 'success',
                        title: 'Task set in progress!',
                        toast: true,
                        showConfirmButton: false,
                        timer: 1350,
                        timerProgressBar: true,
                        hideClass: {
                            popup: 'animate__animated animate__fadeOut animate__faster'
                        }
                    });
                })
        }
    })    
}

//-----------------Apagar tarefa---------------------

function deleteTask(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete the selected task?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete task!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/todos/${id}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => response.json())
            .then(tasks => {
                fetchTasks(tasks);
                Swal.fire(
                    'Deleted!',
                    'Your task has been deleted.',
                    'success'
                );
            });
        }
    });
}

//-----------------------Filtrar tarefa-------------------

function filterTasks(priority) {
    fetch(`/todos/filter/${priority}`) 
        .then(response => response.json())
        .then(tasks => {
            displayTasks(tasks);

            let swalFilter;
            if (priority === 'All') {
                swalFilter = 'Priority filter set <strong>off</strong>.';
            } else {
                swalFilter = `Tasks filtered by <strong>${priority}</strong> priority.`
            }

            Swal.fire({
                position: 'top-start',
                icon: 'success',
                title: swalFilter,
                toast: true,
                showConfirmButton: false,
                timer: 1350,
                timerProgressBar: true,
                hideClass: {
                    popup: 'animate__animated animate__fadeOut animate__faster'
                }
            })
        })
}


//-----------------------Ordenar tarefa--------------------

function sortTasks(sort) {
    fetch(`/todos/sort/${sort}`)
        .then(response => response.json())
        .then(tasks => {
            displayTasks(tasks);

            let swalSort;

            switch (sort) {
                case 'LowToHigh':
                    swalSort = 'Tasks sorted from <strong>Low</strong> to <strong>High</strong> priority';
                    break;
                case 'HighToLow':
                    swalSort = 'Task sorted from <strong>High</strong> to <strong>Low</strong> priority';
                    break;
                case 'AToZ':
                    swalSort = 'Tasks ordered in <strong>alphabetic</strong> order (A-Z)';
                    break;
                case 'ZToA':
                    swalSort = 'Tasks ordered in <strong>reverse alphabetic</strong> order (Z-A)';
                    break;
                default:
                    swalSort = 'Tasks sort option removed';
            }

            Swal.fire({
                position: 'top-start',
                icon: 'success',
                title: swalSort,
                toast: true,
                showConfirmButton: false,
                timer: 1350,
                timerProgressBar: true,
                hideClass: {
                    popup: 'animate__animated animate__fadeOut animate__faster'
                }
            })
        })
}

//----------------------Procurar tarefa--------------------

function searchTasks(search) {
    fetch(`/todos/search/${search}`)
        .then(response => response.json())
        .then(tasks => {
            displayTasks(tasks);
            Swal.fire({
                position: 'top-start',
                icon: 'success',
                title: `Searched tasks by "${search}"`,
                toast: true,
                showConfirmButton: false,
                timer: 1600,
                timerProgressBar: true,
                hideClass: {
                    popup: 'animate__animated animate__fadeOut animate__faster'
                }
            })
        })
}

//----------------Completar todas as tarefas----------------

function completeAllTasks() {
    Swal.fire({
        title: 'Complete all tasks?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#00994d',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes <i class="bi bi-check-all"></i>'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/todos/completeAll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
                .then(response => response.json())
                .then(tasks => {
                    fetchTasks(tasks);
                    Swal.fire({
                        icon: 'success',
                        title: 'All tasks set as completed!',
                        showConfirmButton: false,
                        timer: 1200,
                        timerProgressBar: true,
                    })
                })
        }
    })
}
    


//----------------Incompletar todas as tarefas---------------

function incompleteAllTasks() {
    Swal.fire({
        title: 'Incomplete all tasks?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e6b800',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes <i class="bi bi-arrow-counterclockwise"></i>'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/todos/incompleteAll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
                .then(response => response.json())
                .then((tasks) => {
                    fetchTasks(tasks);
                    Swal.fire({
                        icon: 'success',
                        title: 'All tasks set back in progress!',
                        showConfirmButton: false,
                        timer: 1200,
                        timerProgressBar: true,
                    })
                })
        }
    })
}

//-----------------Apagar tarefas completadas-----------------

function deleteAllCompleted() {
    
    fetch(`/todos/deleteAllCompleted`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then((tasks) => {
            fetchTasks(tasks);
            //Swal de notificação
        })
}

//-----------------Apagar todas as tarefas------------------

function deleteAll() {
    //Retirar modal bootstrap e aplicar swal
    fetch(`/todos/deleteAll`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then((tasks) => {
            fetchTasks(tasks);
            //Swal de notificação de tarefas apagadas
            let modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirm'));
            modal.hide();
        })
}

function getDashboardData() {
    fetch('/dashboardData')
        .then(response => response.json())
        .then(data => {
            document.getElementById('countTotalTasks').innerHTML = data.stats.countTotalTasks;
            document.getElementById('countCompletedTasks').innerHTML = data.stats.countCompletedTasks;
            document.getElementById('countNotCompletedTasks').innerHTML = data.stats.countNotCompletedTasks;
            document.getElementById('countHighPriorityTasks').innerHTML = data.stats.countHighPriorityTasks;
            document.getElementById('countMediumPriorityTasks').innerHTML = data.stats.countMediumPriorityTasks;
            document.getElementById('countLowPriorityTasks').innerHTML = data.stats.countLowPriorityTasks;

            displayHighTasks(data.highTasks);
            displayMediumTasks(data.mediumTasks);
            displayLowTasks(data.lowTasks);
        })
}

function displayHighTasks(tasks) {
    const taskList = document.getElementById('highPriorityList');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('liDashboard', 'mb-1');
        li.innerHTML = `
            <span>${task.description}</span>
            <span class="badge rounded-pill bg-danger" style="float: right;">High</span>
        `;
        taskList.appendChild(li);
    });
}

function displayMediumTasks(tasks) {
    const taskList = document.getElementById('mediumPriorityList');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('liDashboard', 'mb-1');
        li.innerHTML = `
            <span>${task.description}</span>
            <span class="badge rounded-pill bg-warning text-dark" style="float: right;">Medium</span>
        `;
        taskList.appendChild(li);
    });
}

function displayLowTasks(tasks) {
    const taskList = document.getElementById('lowPriorityList');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('liDashboard', 'mb-1');
        li.innerHTML = `
            <span>${task.description}</span>
            <span class="badge rounded-pill bg-success" style="float: right;">Low</span>
        `;
        taskList.appendChild(li);
    });
}


function logoutUser() {
    //Programar Swal
    //Programar fetch /logout
}