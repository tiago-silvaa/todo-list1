const express = require("express");
const app = express();
const db = require("./db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');


//-------------------------|Exibir|-------------------------
app.get('/', async (req, res) => {                                  //Definir rota GET para a raíz
    try {                                                           
        const [tasks] = await db.query('SELECT * FROM tasks');      //Consultar tarefas na base de dados
        res.render('index', { tasks });                             //Renderizar o "index" com as tarefas
    } catch (err) {
        res.status(500).json({ error: err.message });               //Em caso de erro, enviar resposta
    }
});

//-------------------------|Criar|---------------------------
app.post('/tasks', async (req, res) => {                            //Define uma rota POST para '/tasks', quando se envia o formulário
    const { description } = req.body;                               //Extrai propriedade "description" da request
    try {
        await db.query('INSERT INTO tasks (description) VALUES (?)', [description]);  //Insere na base de dados a descrição da tarefa
        res.redirect('/');                                          //Recarregar página
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//----------------------|Atualizar|-----------------------------

app.post('/tasks/:id/complete', async(req, res) => {                 //Definir rota POST para marcar uma tarefa como concluída com base no ID
    const { id } = req.params;                                      //Extrai o parâmetro "id" da request
    try {   
        await db.query('UPDATE tasks SET completed = TRUE WHERE id = ?', [id]);     //Executar consulta que atualize a tarefa para "completed"
        res.redirect('/');     
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//------------------------|Apagar|---------------------------

app.post('/tasks/:id/delete', async (req, res) => {                 //Definir rota POST para apagar uma tarefa com base no ID
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tasks WHERE id = ?', [id]);        //Apagar da base dados a tarefa selecionada de acordo com o id
        res.redirect('/');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//------------------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//http://localhost:3000