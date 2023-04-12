db = db.getSiblingDB("users");

db.users.insertMany([
    { username: "user", password: "password" },
    { username: "test1", password: "password1" },
]);

db.users.createIndex(
    { username: 1 },
    { unique: true }
);