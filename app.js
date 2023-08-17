const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is up and running at http://localhost/3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
//API 1
app.get("/todos/", async (request, response) => {
  let { search_q = "", priority, status } = request.query;
  let getStatusToDo = "";
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getStatusToDo = `
          SELECT *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND status='${status}'
          AND priority='${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getStatusToDo = `
          SELECT *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND priority='${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getStatusToDo = `
          SELECT *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%'
          AND status='${status}';`;
      break;
    default:
      getStatusToDo = `
          SELECT *
          FROM
          todo
          WHERE
          todo LIKE '%${search_q}%';`;
      break;
  }
  let listOfToDo = await db.all(getStatusToDo);
  response.send(listOfToDo);
});

///API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const specificQuery = await db.get(getSpecificQuery);
  response.send(specificQuery);
});
//API 3 create a todo in todo Table
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const createToDoQuery = `INSERT INTO todo(id,todo,priority,status) 
    VALUES (
        '${id}',
        '${todo}',
        '${priority}',
        '${status}'
    )`;
  await db.run(createToDoQuery);
  response.send("Todo Successfully Added");
});
// API 4 Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const previousToDoQuery = `
  SELECT * 
  FROM 
  todo`;
  const previousToDo = await db.get(previousToDoQuery);
  const {
    id = previousToDo.id,
    todo = previousToDo.todo,
    priority = previousToDo.priority,
    status = previousToDo.status,
  } = request.body;
  const updateQuery = `
  UPDATE todo
  SET
  todo='${todo}',
  priority='${priority}',
  status='${status}'
  WHERE
  id=${todoId};`;
  db.run(updateQuery);
  switch (true) {
    case request.body.status !== undefined:
      response.send("Status Updated");
      break;
    case request.body.priority !== undefined:
      response.send("Priority Updated");
      break;
    case request.body.todo !== undefined:
      response.send("Todo Updated");
      break;
  }
});
// API 5 DELETE the details of a specific todo based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE
    id=${todoId};`;
  db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
