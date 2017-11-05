module.exports = {
    "up": "CREATE TABLE agents (id INT PRIMARY KEY AUTO_INCREMENT, name LONGTEXT, email LONGTEXT, password LONGTEXT)",
    "down": "DROP TABLE agents"
};