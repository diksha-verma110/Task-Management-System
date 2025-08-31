let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || ["Academics", "Personal", "Goals"];

// Toggle show/hide
function toggleSection(id) {
  const section = document.getElementById(id);
  section.classList.toggle("hidden");
}

// Save to storage
function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("categories", JSON.stringify(categories));
}

// Render categories
function renderCategories() {
  const categoryInput = document.getElementById("categoryInput");
  categoryInput.innerHTML = "";
  document.getElementById("tasksContainer").innerHTML = "";

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryInput.appendChild(option);

    const safeCatId = cat.toLowerCase().replace(/\s+/g, '');
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "card";
    sectionDiv.id = safeCatId + "Card";
    sectionDiv.innerHTML = `
      <div class="section-header">
        <span class="cat-name" onclick="toggleSection('${safeCatId}Section')">
          📂 ${cat} <span id="${safeCatId}ProgressText">0 / 0</span>
        </span>
        <div class="cat-actions">
          <button onclick="renameCategory('${cat}')">Edit</button>
          <button onclick="deleteCategory('${cat}')">Delete</button>
        </div>
      </div>
      <div class="progress-bar"><div id="${safeCatId}Progress" class="progress"></div></div>
      <div id="${safeCatId}Section" class="hidden"></div>
    `;
    document.getElementById("tasksContainer").appendChild(sectionDiv);
  });

  const newOpt = document.createElement("option");
  newOpt.value = "addNew";
  newOpt.textContent = "➕ Add Category";
  categoryInput.appendChild(newOpt);
}

function addTask() {
  const taskText = document.getElementById("taskInput").value.trim();
  const deadline = document.getElementById("deadlineInput").value;
  const priority = document.getElementById("priorityInput").value;
  let category = document.getElementById("categoryInput").value;

  // Handle "Add New Category" first
  if (category === "addNew") {
    const newCategory = prompt("Enter new category name:");
    if (!newCategory) {
      alert("Category name cannot be empty!");
      return;
    }
    if (categories.includes(newCategory)) {
      alert("Category already exists!");
      return;
    }
    categories.push(newCategory);
    saveData();
    renderCategories();
    category = newCategory; // use this new category for the task
  }

  // Simple validation: check all fields
  if (!taskText || !deadline || !priority || !category) {
    alert("⚠ Please fill all fields before adding a task!");
    return;
  }

  const task = { text: taskText, deadline, priority, category, completed: false };
  tasks.push(task);
  saveData();
  renderTasks();

  // Clear input fields
  document.getElementById("taskInput").value = "";
  document.getElementById("deadlineInput").value = "";
  document.getElementById("priorityInput").value = "Low";
  document.getElementById("categoryInput").value = categories[0];
}



// Render tasks (sorted by deadline, then priority)
function renderTasks() {
  categories.forEach(cat => {
    const section = document.getElementById(cat.toLowerCase().replace(/\s+/g,'') + "Section");
    if (section) section.innerHTML = "";

    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    const catTasks = tasks
      .map((t, idx) => ({ ...t, globalIndex: idx })) // attach global index
      .filter(t => t.category === cat)
      .sort((a, b) => {
        if (a.deadline && b.deadline) {
          const dateA = new Date(a.deadline);
          const dateB = new Date(b.deadline);
          if (dateA - dateB !== 0) return dateA - dateB;
        }
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
      });

    const completed = catTasks.filter(t => t.completed).length;

    catTasks.forEach(t => {
      const div = document.createElement("div");
      div.className = "task";
      div.innerHTML = `
        <span>
          <input type="checkbox" onchange="toggleComplete(${t.globalIndex})" ${t.completed ? "checked" : ""}>
          ${t.text} - <small>${t.deadline}</small> - <b>${t.priority}</b>
        </span>
        <button class="delete-btn" onclick="deleteTask(${t.globalIndex})">✖</button>
      `;
      section.appendChild(div);

      // Reminder
      if (t.deadline) {
        const dueDate = new Date(t.deadline);
        const now = new Date();
        if (dueDate - now < 86400000 && !t.notified) {
          alert(`Reminder: "${t.text}" is due soon!`);
          tasks[t.globalIndex].notified = true;
          saveData();
        }
      }
    });

    // Progress bar
    const progress = document.getElementById(cat.toLowerCase().replace(/\s+/g,'') + "Progress");
    const progressText = document.getElementById(cat.toLowerCase().replace(/\s+/g,'') + "ProgressText");
    if (progress) {
      const percentage = catTasks.length ? (completed / catTasks.length) * 100 : 0;
      progress.style.width = percentage + "%";
      progressText.textContent = `${completed} / ${catTasks.length}`;
    }
  });
}

// Toggle complete
function toggleComplete(globalIndex) {
  tasks[globalIndex].completed = !tasks[globalIndex].completed;
  saveData();
  renderTasks();
}

// Delete task
function deleteTask(globalIndex) {
  tasks.splice(globalIndex, 1);
  saveData();
  renderTasks();
}

// Rename category
function renameCategory(oldName) {
  const newName = prompt("Enter new name for category:", oldName);
  if (!newName || categories.includes(newName)) return;
  tasks.forEach(t => { if (t.category === oldName) t.category = newName; });
  const idx = categories.indexOf(oldName);
  if (idx !== -1) categories[idx] = newName;
  saveData();
  renderCategories();
  renderTasks();
}

// Delete category
function deleteCategory(cat) {
  if (!confirm(`Delete category "${cat}" and all its tasks?`)) return;
  tasks = tasks.filter(t => t.category !== cat);
  categories = categories.filter(c => c !== cat);
  saveData();
  renderCategories();
  renderTasks();
}

// Init
renderCategories();
renderTasks();