//--------------------Listar tarefas------------------

const { response } = require("express");

document.addEventListener('DOMContentLoaded', fetchTasks);

function fetchTasks() {
    fetch('/todos')
        .then(response => response.json())
        .then(tasks => {
            displayTasks(tasks);
        })
}

function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (tasks.lenght === 0) {
        taskList.innerHTML += `
                <div class="alert alert-primary alert-dismissible fade show mt-3" role="alert">
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    <strong>Warning!</strong> There are no tasks.
                </div>
        `
    } else {
        tasks.forEach(task => {
            taskList.innerHTML += `
                <li class="list-group-item mb-2">
                    <span class="${task.completed ? 'completed' : ''}  description">${task.description}</span>

                    ${task.priority === 'High' ? '<span class="badge bg-danger">High</span>' : 
                        task.priority === 'Medium' ? '<span class="badge bg-warning text-dark">Medium</span>' : 
                        '<span class="badge bg-success">Low</span>'}

                    <button type="button" class="btn btn-outline-primary btn-sm mx-3" data-bs-toggle="modal" data-bs-target="#editTaskModal" 
                        onclick="">
                        <i class="bi bi-pencil-square"></i></button>

                    <div class="btn-group task-btn-group"> 
                        <button type="button" class="btn btn-outline-success mx-1" onclick=""><i class="bi bi-check-all"></i></button>
                        <button type="button" class="btn btn-outline-warning mx-1" onclick=""><i class="bi bi-arrow-counterclockwise"></i></button>
                        <button type="button" class="btn btn-danger mx-1" onclick=""><i class="bi bi-x"></i></button>
                    </div>                     
                </li>
            `
        })       
    }
}

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
    })
}

//----------------------Registo---------------------

document.getElementById('register-form').addEventListener('submit', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    registerUser(username, password);
});

function registerUser(username, password) {
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
}

//------------------Login------------------------

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    loginUser(username, password);
    window.location.href = '/todos'; 
});

function loginUser(username, password) {
    return fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
}

//------------------------Editar tarefaaaaa-------------------------
document.getElementById('editTask-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const id = document.getElementById('task-id').value;
    const newDescription = document.getElementById('newDescription').value;
    const newPriority = document.getElementById('newPriority').value;

    editTask(id, newDescription, newPriority);
});

function editTask(id, newDescription, newPriority) {
    return fetch(`/todos/${id}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newDescription, newPriority })
    })
    .then(response => {
        fetchTasks();
    })
}

//--------------------Completar tarefa---------------

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
    })
}

//-------------------Incompletar tarefa---------------

function incompleteTask(id) {
    fetch(`/todos/${id}/notcomplete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(tasks => {
        fetchTasks(tasks);
    })
}

//-----------------Apagar tarefa---------------------

function deleteTask(id) {
    fetch(`/todos/${id}/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(tasks => {
        fetchTasks(tasks);
    })
}

//-----------------------Filtrar tarefa-------------------

document.getElementById('priorityFilter').addEventListener('change', function() {
    const priority = document.getElementById('priorityFilter').value
    filterTasks(priority);
})

function filterTasks(priority) {
    fetch(`/todos/filter/${priority}`) 
        .then(response => response.json())
        .then(tasks => {
            fetchTasks(tasks);
        })
}


//-----------------------Ordenar tarefa--------------------

document.getElementById('sortFilter').addEventListener('change', function() {
    const sort = document.getElementById('sortFilter').value;
    sortTasks(sort);
})

function sortTasks(sort) {
    fetch(`/todos/sort/${sort}`)
        .then(response => response.json())
        .then(tasks => {
            fetchTasks(tasks);
        })
}

//----------------------Procurar tarefa--------------------

document.getElementById('searchFilter').addEventListener('submit', function() {
    const searchWord = document.getElementById('searchInput').value;
    searchTasks(searchWord);
})

function searchTasks(searchedWord) {
    fetch(`/todos/search`)
        .then(response => response.json())
        .then(tasks => {
            fetchTasks(tasks);
        })
}

//----------------Completar todas as tarefas----------------

function completeAllTasks() {
    fetch(`/todos/completeAll`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(tasks => {
        fetchTasks(tasks);
    })
}

//----------------Incompletar todas as tarefas---------------

function incompleteAllTasks() {
    fetch(`/todos/incompleteAll`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(tasks => {
        fetchTasks(tasks);
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
    .then(tasks => {
        fetchTasks(tasks);
    })
}

//-----------------Apagar todas as tarefas------------------

function deleteAll() {
    fetch(`/todos/deleteAll`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(tasks => {
        fetchTasks(tasks);
    })
}

