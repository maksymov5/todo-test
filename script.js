// ========================================
// STATE MANAGEMENT
// ========================================

class TodoState {
    constructor() {
        this.todos = this.loadFromStorage();
        this.currentFilter = 'all';
    }

    // Storage key
    get storageKey() {
        return 'todos-app-state';
    }

    // Load todos from localStorage
    loadFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    // Save todos to localStorage
    saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
    }

    // Create a new todo
    addTodo(text, priority = 'medium') {
        const todo = {
            id: Date.now(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        this.todos.unshift(todo);
        this.saveToStorage();
        return todo;
    }

    // Update a todo
    updateTodo(id, updates) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            Object.assign(todo, updates);
            this.saveToStorage();
        }
        return todo;
    }

    // Delete a todo
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage();
    }

    // Toggle todo completion
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
        }
        return todo;
    }

    // Get todos based on filter
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    // Get statistics
    getStats() {
        return {
            total: this.todos.length,
            active: this.todos.filter(t => !t.completed).length,
            completed: this.todos.filter(t => t.completed).length,
        };
    }

    // Clear all completed todos
    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveToStorage();
    }

    // Delete all todos
    deleteAll() {
        this.todos = [];
        this.saveToStorage();
    }
}

// ========================================
// UI MANAGEMENT
// ========================================

class TodoUI {
    constructor(state) {
        this.state = state;
        this.setupElements();
        this.setupEventListeners();
        this.render();
    }

    setupElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.deleteAllBtn = document.getElementById('deleteAllBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.totalCount = document.getElementById('totalCount');
        this.activeCount = document.getElementById('activeCount');
        this.completedCount = document.getElementById('completedCount');
    }

    setupEventListeners() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.handleAddTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTodo();
        });

        // Filter todos
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e.target));
        });

        // Clear and delete actions
        this.clearCompletedBtn.addEventListener('click', () => this.handleClearCompleted());
        this.deleteAllBtn.addEventListener('click', () => this.handleDeleteAll());
    }

    handleAddTodo() {
        const text = this.todoInput.value.trim();
        if (!text) {
            this.showNotification('Please enter a task');
            return;
        }

        this.state.addTodo(text);
        this.todoInput.value = '';
        this.render();
        this.todoInput.focus();
    }

    handleFilterChange(btn) {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.currentFilter = btn.dataset.filter;
        this.render();
    }

    handleToggleTodo(id) {
        this.state.toggleTodo(id);
        this.render();
    }

    handleDeleteTodo(id) {
        this.state.deleteTodo(id);
        this.render();
    }

    handleEditTodo(id) {
        const todo = this.state.todos.find(t => t.id === id);
        if (!todo) return;

        const newText = prompt('Edit task:', todo.text);
        if (newText && newText.trim()) {
            this.state.updateTodo(id, { text: newText.trim() });
            this.render();
        }
    }

    handleClearCompleted() {
        if (this.state.getStats().completed === 0) {
            this.showNotification('No completed tasks to clear');
            return;
        }

        if (confirm('Are you sure you want to clear all completed tasks?')) {
            this.state.clearCompleted();
            this.render();
        }
    }

    handleDeleteAll() {
        if (this.state.todos.length === 0) {
            this.showNotification('No tasks to delete');
            return;
        }

        if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
            this.state.deleteAll();
            this.render();
        }
    }

    render() {
        this.updateStats();
        this.renderTodos();
    }

    updateStats() {
        const stats = this.state.getStats();
        this.totalCount.textContent = stats.total;
        this.activeCount.textContent = stats.active;
        this.completedCount.textContent = stats.completed;
    }

    renderTodos() {
        const filteredTodos = this.state.getFilteredTodos();
        this.todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');

        filteredTodos.forEach(todo => {
            const li = this.createTodoElement(todo);
            this.todoList.appendChild(li);
        });
    }

    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => this.handleToggleTodo(todo.id));

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;

        const priorityBadge = document.createElement('span');
        priorityBadge.className = `priority-badge ${todo.priority}`;
        priorityBadge.textContent = todo.priority;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'todo-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => this.handleEditTodo(todo.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => this.handleDeleteTodo(todo.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(priorityBadge);
        li.appendChild(actionsDiv);

        return li;
    }

    showNotification(message) {
        // Simple notification using browser alert (can be replaced with a better UI)
        console.log(`Notification: ${message}`);
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const state = new TodoState();
    const ui = new TodoUI(state);

    // Make state and ui available globally for debugging
    window.todoState = state;
    window.todoUI = ui;
});
