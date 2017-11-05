module.exports = {
"up": "CREATE TABLE messages (id INT PRIMARY KEY AUTO_INCREMENT, session_id INT, message_body LONGTEXT, from_type ENUM('VISITOR', 'AGENT'), agent_id INT)",
    "down": "DROP TABLE messages"
};