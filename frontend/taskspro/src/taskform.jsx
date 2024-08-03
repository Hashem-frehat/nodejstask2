import React, { useState, useEffect } from "react";
import axios from "axios";

function Alltasks() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    task_name: "",
    task_description: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:4020/tasks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:4020/tasks",
        newTask,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNewTask({ task_name: "", task_description: "" });
      fetchTasks();
    } catch (error) {
      console.error(
        "خطأ في إنشاء المهمة:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:4020/tasks/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div>
      <h2>tasks</h2>
      <form onSubmit={handleCreateTask}>
        <input
          type="text"
          placeholder="Task Name"
          value={newTask.task_name}
          onChange={(e) =>
            setNewTask({ ...newTask, task_name: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Task Description"
          value={newTask.task_description}
          onChange={(e) =>
            setNewTask({ ...newTask, task_description: e.target.value })
          }
        />
        <button type="submit">Create Task</button>
      </form>
      <ul>
        {tasks.map((task) => (
          <li key={task.task_id}>
            {task.task_name} - {task.task_description}
            <button onClick={() => handleDeleteTask(task.task_id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Alltasks;
