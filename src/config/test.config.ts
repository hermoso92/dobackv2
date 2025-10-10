export const testConfig = {
    database: {
        host: 'localhost',
        user: 'test',
        password: 'test',
        database: 'test_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    },
    jwt: {
        secret: 'test_secret',
        expiration: '1h'
    },
    email: {
        host: 'smtp.test.com',
        port: 587,
        user: 'test@test.com',
        pass: 'test_password'
    }
}; 