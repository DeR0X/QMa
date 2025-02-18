import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true, // For development only
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create a connection pool
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('SQL Pool Error:', err);
});

export async function executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
  try {
    await poolConnect;
    const request = pool.request();
    
    // Add parameters if any
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

// Example usage:
// const users = await executeQuery<User>('SELECT * FROM Users WHERE active = @param0', [true]);

// Ensure the pool is properly closed when the application shuts down
process.on('SIGINT', async () => {
  try {
    await pool.close();
    console.log('Pool successfully closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing pool:', err);
    process.exit(1);
  }
});

export default pool;