const express = require("express");
const app = express();
const db = require("./db");
const session = require("express-session");
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'todo',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

//-----------------------Rotas de Login e Registo--------------------

app.get('/', async( req, res) => {
    res.render('home');
})

//Direcionar para página de registo
app.get('/register', async( req, res) => {
    res.render('register');
})

//Efetuar registo
app.post('/register', async( req, res) => {
    
    const { username, password} = req.body;

    try {
        await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        req.session.message = { type: 'success', content: 'Registration successful, please log in.' };
        res.redirect('login');
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to register user' });
    }
})

//Direcionar para página de login
app.get('/login', async( req, res) => {
    res.render('login');
});

//Efetuar login
app.post('/login', async(req, res) => {
    const { username, password} = req.body;

    const [userData] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (userData.length === 0 || userData[0].password !== password) {
        req.session.message = { type: 'danger', content: 'Invalid username / password' };
        return res.redirect('/login');;
    } else {
        req.session.message = { type: 'success', content: 'Successful login' };
        req.session.user = { id: userData[0].id, username };
        res.redirect('/todos') 
    }
})

function authenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/');
    }
}

//Endpoint para display do username do user logado

app.get('/username', authenticated, async(req, res) => {
    res.json({ username: req.session.user.username});
})

//Logout: Terminar sessão

app.post('/logout', authenticated, async(req, res) => {
    req.session.destroy();
    res.redirect('/');
})

//-------------------------|Read|-------------------------

//Endpoint para ir para a página das tarefas

app.get('/todos', authenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
        res.render('index', { tasks });
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
})

//Endpoint para ser possível fazer Fetch() dos dados da lista

app.get('/todosData', authenticated, async (req, res) => {
    
    try {
        const userId = req.session.user.id;
        const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

//Endpoint para exibir tarefas por propriedade

app.get('/todos/filter-sort/:filter/:sort', authenticated, async(req, res) => {

})

app.get('/todos/filter/:priority', authenticated, async (req, res) => {
    const {priority} = req.params;
    const userId = req.session.user.id;

    let tasks;

    if (priority === 'All') {
        [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    }   else {
        [tasks] = await db.query('SELECT * FROM tasks WHERE priority = ? AND user_id = ?', [priority, userId]);
    }
    res.json(tasks);
})

//Endpoint para exibir tarefas ordenadas 

app.get('/todos/sort/:sort', authenticated, async(req, res) => {
    const { sort } = req.params;
    const userId = req.session.user.id;
    let tasks;

    if (sort === 'LowToHigh') {
        [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY priority DESC', [userId]);
    } else if (sort === 'HighToLow') {
        [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY priority ASC', [userId]);
    } else if (sort === 'AToZ') {
        [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY description ASC', [userId]);
    } else if (sort === 'ZToA') {
        [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY description DESC', [userId]);
    } else {
        [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    }
    res.json(tasks);
    
});

//Pesquisar tarefa
app.get('/todos/search/:search', authenticated, async (req, res) => {
    const {search} = req.params;
    const userId = req.session.user.id;

    const [tasks] = await db.query('SELECT * FROM tasks WHERE description LIKE ? AND user_id = ?', [`%${search}%`, userId]);

    res.json(tasks);
})

app.get('/dashboard', authenticated, async(req, res) => {
    res.render('dashboard');
})

app.get('/dashboardData', authenticated, async(req, res) => {

    const userId = req.session.user.id;
    const stats = await getTaskStats(userId);

    const [highTasks] = await db.query('SELECT * FROM tasks WHERE priority = "High" AND user_id = ?', [userId]);
    const [mediumTasks] = await db.query('SELECT * FROM tasks WHERE priority = "Medium" AND user_id = ?', [userId]);
    const [lowTasks] = await db.query('SELECT * FROM tasks WHERE priority = "Low" AND user_id = ?', [userId]);

    res.json( { highTasks, mediumTasks, lowTasks, stats } );
})

//-------------------------|Create|---------------------------

//Criar tarefa: descrição e prioridade
app.post('/todos', authenticated, async (req, res) => {
    const { description, priority } = req.body;
    const userId = req.session.user.id;

    try {

        const [result] = await db.query('INSERT INTO tasks (description, priority, user_id) VALUES (?, ?, ?)', [description, priority, userId]);
        const [task] = {
            id: result.insertId,
            description,
            priority,
            user_id: userId
        };
        res.json(task);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//----------------------|Update|-----------------------------

//Atualizar tarefa (atualizar descrição, estado e prioridade)

app.post('/todos/:id/update', authenticated, async (req, res) => {
    const { id } = req.params;
    const { editDescription, editPriority } = req.body;
    const userId = req.session.user.id;

    await db.query('UPDATE tasks SET description = ?, priority = ? WHERE id = ? AND user_id = ?', [editDescription, editPriority, id, userId]);
    res.json({ success: true });
});


//Atualizar para completed
app.post('/todos/:id/complete', authenticated, async(req, res) => {                 
    const { id } = req.params;
    const userId = req.session.user.id;
    try {   
        await db.query('UPDATE tasks SET completed = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
        const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);  
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Atualizar todos para completed
app.post('/todos/completeAll', authenticated, async(req, res) => {

    const userId = req.session.user.id;

    await db.query('UPDATE tasks SET completed = TRUE WHERE completed = FALSE AND user_id = ?', [userId]);
    const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);  
    res.json(tasks);
});

//Atualizar para not completed
app.post('/todos/:id/notcomplete', authenticated, async(req, res) => {                 
    const { id } = req.params;
    const userId = req.session.user.id;                           
    try {   
        await db.query('UPDATE tasks SET completed = FALSE WHERE id = ? AND user_id = ?', [id, userId]);
        
        const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);  

        res.json(tasks);  
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/todos/incompleteAll', authenticated, async(req, res) => {

    const userId = req.session.user.id;
    await db.query('UPDATE tasks SET completed = FALSE WHERE user_id = ?', [userId]);

    const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    
    res.json(tasks);
});


//------------------------|Delete|---------------------------

app.post('/todos/:id/delete', authenticated, async (req, res) => {                 
    const { id } = req.params;
    const userId = req.session.user.id;
    try {
        await db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);

        const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
        res.json(tasks);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Apagar todas as tasks completadas
app.post('/todos/deleteAllCompleted', authenticated, async (req, res) => {

    const userId = req.session.user.id;

    await db.query('DELETE FROM tasks WHERE completed = true AND user_id = ?', [userId]);
    const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);  
    res.json(tasks);
});

app.post('/todos/deleteAll', authenticated, async (req, res) => {

    const userId = req.session.user.id;

    await db.query('DELETE FROM tasks WHERE user_id = ?', [userId]);
    const [tasks] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    
    res.json(tasks);
});

//------------------------------------------------------------------

async function getTaskStats(userId) {
    const [countTotalTasks] = await db.query('SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?', [userId]);
    const [countNotCompletedTasks] = await db.query('SELECT COUNT(*) AS count FROM tasks WHERE completed = FALSE AND user_id = ?', [userId]);
    const [countCompletedTasks] = await db.query('SELECT COUNT(*) AS count FROM tasks WHERE completed = TRUE AND user_id = ?', [userId]);
    const [countHighPriorityTasks] = await db.query('SELECT COUNT(*) AS count FROM tasks WHERE priority = "High" AND user_id = ?', [userId]);
    const [countMediumPriorityTasks] = await db.query('SELECT COUNT(*) AS count FROM tasks WHERE priority = "Medium" AND user_id = ?', [userId]);
    const [countLowPriorityTasks] = await db.query('SELECT COUNT(*) AS count FROM tasks WHERE priority = "Low" AND user_id = ?', [userId]);

    return {
        countTotalTasks: countTotalTasks[0].count,
        countNotCompletedTasks: countNotCompletedTasks[0].count,
        countCompletedTasks: countCompletedTasks[0].count,
        countHighPriorityTasks: countHighPriorityTasks[0].count,
        countMediumPriorityTasks: countMediumPriorityTasks[0].count,
        countLowPriorityTasks: countLowPriorityTasks[0].count,
    };
}

//------------------------------------------------------------------

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//http://localhost:3000