module.exports = {
    "up": "CREATE TABLE sessions (id INT PRIMARY KEY AUTO_INCREMENT, identifier LONGTEXT, status ENUM('OPEN', 'CLOSED'), create_time DATETIME)",
    "down": "DROP TABLE sessions"
};