const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at PORT 3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const validStatuses = ["TO DO", "IN PROGRESS", "DONE"];
const validPriorities = ["HIGH", "MEDIUM", "LOW"];
const validCategories = ["WORK", "HOME", "LEARNING"];

const validateQueryParams = (query, validValues, errorMessage) => {
  if (query && !validValues.includes(query)) {
    return errorMessage;
  }
  return null;
};

// API 1
app.get("/todos/", async (req, res) => {
  const { status, priority, search_q, category } = req.query;

  let error =
    validateQueryParams(status, validStatuses, "Invalid Todo Status") ||
    validateQueryParams(priority, validPriorities, "Invalid Todo Priority") ||
    validateQueryParams(category, validCategories, "Invalid Todo Category");

  if (error) {
    res.status(400).send(error);
    return;
  }

  const getQuery = `
    SELECT * 
    FROM todo 
    WHERE 
        status LIKE '%${status}%' AND
        priority LIKE '%${priority}%' AND
        todo LIKE '%${search_q}%' AND
        category LIKE '%${category}%';`;

  const dbRes = await db.all(getQuery);
  res.send(dbRes);
});

// API 2
app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const getQuery = `
    SELECT * FROM todo
    WHERE id=${todoId};`;

  const dbRes = await db.get(getQuery);
  res.send(dbRes);
});

// API 3
app.get("/agenda/", async (req, res) => {
  const { date } = req.query;

  if (!isValid(new Date(date))) {
    res.status(400).send("Invalid Due Date");
    return;
  }

  const formattedDate = format(new Date(date), "yyyy-MM-dd");

  const getQuery = `
    SELECT * FROM todo
    WHERE due_date = '${formattedDate}';`;

  const dbRes = await db.all(getQuery);
  res.send(dbRes);
});

// API 4
app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;

  let error =
    validateQueryParams(status, validStatuses, "Invalid Todo Status") ||
    validateQueryParams(priority, validPriorities, "Invalid Todo Priority") ||
    validateQueryParams(category, validCategories, "Invalid Todo Category");

  if (error) {
    res.status(400).send(error);
    return;
  }

  if (!isValid(new Date(dueDate))) {
    res.status(400).send("Invalid Due Date");
    return;
  }

  const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");

  const postQuery = `
    INSERT INTO todo (id, todo, priority, status, category, due_date)
    VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}');`;

  await db.run(postQuery);
  res.send("Todo Successfully Added");
});

// API 5
const updateTodoField = async (res, todoId, field, value, fieldName) => {
  const putQuery = `
    UPDATE todo
    SET ${field} = '${value}'
    WHERE id = ${todoId};`;
  await db.run(putQuery);
  res.send(`${fieldName} Updated`);
};

app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const { status, priority, todo, category, dueDate } = req.body;

  if (status) {
    if (!validStatuses.includes(status)) {
      res.status(400).send("Invalid Todo Status");
      return;
    }
    await updateTodoField(res, todoId, "status", status, "Status");
  } else if (priority) {
    if (!validPriorities.includes(priority)) {
      res.status(400).send("Invalid Todo Priority");
      return;
    }
    await updateTodoField(res, todoId, "priority", priority, "Priority");
  } else if (todo) {
    await updateTodoField(res, todoId, "todo", todo, "Todo");
  } else if (category) {
    if (!validCategories.includes(category)) {
      res.status(400).send("Invalid Todo Category");
      return;
    }
    await updateTodoField(res, todoId, "category", category, "Category");
  } else if (dueDate) {
    if (!isValid(new Date(dueDate))) {
      res.status(400).send("Invalid Due Date");
      return;
    }
    const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
    await updateTodoField(res, todoId, "due_date", formattedDate, "Due Date");
  }
});

// API 6
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE id=${todoId};`;

  await db.run(deleteQuery);
  res.send("Todo Deleted");
});

module.exports = app;

// const express = require("express");
// const { open } = require("sqlite");
// const sqlite3 = require("sqlite3");
// const path = require("path");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const format = require("date-fns/format");
// const isValid = require("date-fns/isValid");

// const app = express();
// app.use(express.json());

// const dbPath = path.join(__dirname, "todoApplication.db");

// let db;

// const intialiseDbAndServer = async () => {
//   try {
//     db = await open({
//       filename: dbPath,
//       driver: sqlite3.Database,
//     });
//     app.listen(3000, () => {
//       console.log("Server Running at PORT 3000");
//     });
//   } catch (e) {
//     console.log(`DB Error: ${e.message}`);
//     process.exit(1);
//   }
// };

// intialiseDbAndServer();

// const validStatuses = ["TO DO", "IN PROGRESS", "DONE"];
// const validPriorities = ["HIGH", "MEDIUM", "LOW"];
// const validCategories = ["WORK", "HOME", "LEARNING"];

// const validateQueryParams = (query, validValues, errorMessage) => {
//   if (query && !validValues.includes(query)) {
//     return errorMessage;
//   }
//   return null;
// };

// //api 1
// app.get("/todos/", async (req, res) => {
//   const {
//     status = "",
//     priority = "",
//     search_q = "",
//     category = "",
//   } = req.query;
//   const getQuery = `
//     SELECT *
//     FROM todo
//     WHERE
//         status LIKE '%${status}%' AND
//         priority LIKE '%${priority}%' AND
//         todo LIKE '%${search_q}%' AND
//         category LIKE '%${category}%';`;

//   const dbRes = await db.all(getQuery);
//   res.send(dbRes);
// });

// //api 2
// app.get("/todos/:todoId/", async (req, res) => {
//   const { todoId } = req.params;
//   const getQuery = `
//     SELECT * FROM todo
//     WHERE id=${todoId};`;

//   const dbRes = await db.get(getQuery);
//   res.send(dbRes);
// });

// //api 3
// app.get("/agenda/", async (req, res) => {
//   const { date } = req.query;
//   const formattedDate = format(new Date(date), "yyyy-MM-dd");
//   formattedDate.toString();
//   console.log(formattedDate, "lokesh");
//   const getQuery = `
//     SELECT * FROM todo
//     WHERE due_date = ${formattedDate};`;

//   const dbRes = await db.all(getQuery);
//   res.send(dbRes);
// });

// //api 4
// app.post("/todos/", async (req, res) => {
//   const { id, todo, priority, status, category, dueDate } = req.body;
//   const postQuery = `
//     INSERT INTO todo(id,todo,priority,status,category,due_date)
//     VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;

//   await db.run(postQuery);
//   res.send("Todo Successfully Added");
// });

// //api 5

// let fieldObj = {
//   status: "status",
//   priority: "priority",
//   todo: "todo",
//   category: "category",
//   dueDate: "due_date",
// };

// let upperObj = {
//   status: "Status",
//   priority: "Priority",
//   todo: "Todo",
//   category: "Category",
//   dueDate: "Due Date",
// };

// app.put("/todos/:todoId/", async (req, res) => {
//   const { todoId } = req.params;
//   const reqObj = req.body;
//   const obj = Object.keys(reqObj)[0];
//   const putQuery = `
//     UPDATE todo
//     SET ${fieldObj[obj]} = '${reqObj[obj]}'
//     WHERE id=${todoId};`;
//   await db.run(putQuery);
//   res.send(`${upperObj[obj]} Updated`);
// });

// //api 6
// app.delete("/todos/:todoId/", async (req, res) => {
//   const { todoId } = req.params;
//   const deleteQuery = `
//     DELETE FROM todo
//     WHERE id=${todoId};`;

//   await db.run(deleteQuery);
//   res.send("Todo Deleted");
// });

// module.exports = app;
