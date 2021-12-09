const {Pool} = require('pg');

const pool = new Pool({
    user: "olcpuspklcyuvx",
    password: "8ca94e9bbe858fd6dd9b904c18c3518eedccb7a460a5f3780492b9a3055b0fbd", 
    host: "ec2-3-211-228-251.compute-1.amazonaws.com",
    port: 5432,
    database: "d9ee4pkbrup9lt",
	ssl: {
		rejectUnauthorized: false
	}
});

module.exports = pool;