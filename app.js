const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const hashpassword = require('./tools/genhashpassword')
const rateLimit = require('express-rate-limit');

const cors = require('cors');

let corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browers (IE11, various SmartTVs) choke on 204
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
    method: ['GET', 'POST', 'OPTION', 'PUT', 'DELETE', 'PUTCH']
  }
app.use(cors(corsOptions));


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	message: 'Too many requests, please try again later.',
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)

//MySQL connection
async function connectToSQL() {
    try{
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'init',
            database: 'bookstore',
            waitForConnections: true,
            connectionLimit: 10, // Adjust based on your needs
            queueLimit: 0 // Unlimited queueing
            });
        return connection;
    } catch (error) {
        console.log("Error in connecting to SQL "+ error);
    }
}

app.use(express.json());

app.get('/bookGet', async (req,res)=>{
    try {
        const DBOP = await connectToSQL();
        const query = 'SELECT * FROM books';
        const [results] = await DBOP.query(query);

        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing

        });
        res.status(200).json({ Books: results })
    } catch (error) {
        console.log(error);
        res.status(500).json( { message: 'Internal server error! '} );
    }
})

// Get book by the id
app.get('/bookGet/:id' ,async (req,res)=> {
    try {
        const bookid = req.params.id;
        //DB operation
        const DBOP = await connectToSQL();
        const query = 'SELECT * FROM books WHERE id = ?'
        const [results] = await DBOP.query(query, [bookid]);

        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });
        res.status(200).json({ Book: results })
    } catch (error) {
        console.log(error);
        res.status(500).json( { message: 'Internal server error! '} );
    }
})

// Get book by the id
app.post('/bookCreate', async (req,res)=> {
    try {
        const { title, author, ISBN, publisher, year_published } = req.body;
        if (!title || !author || !year_published || !ISBN || !publisher) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        //DB operation
        const DBOP = await connectToSQL();
        let query = 'SELECT * FROM books WHERE title = ? OR ISBN = ?;'
        let [results] = await DBOP.query(query, [title, ISBN]);
        if(results.length !== 0) {
            return res.status(400).json({ message: 'This books already exist!' });
        }

        query = 'INSERT INTO books (title, author, ISBN, publisher, year_published, bookGetDate, is_available) VALUES (?, ?, ?, ?, ?, NOW(), true);'
        [results] = await DBOP.query(query, [title, author, ISBN, publisher, year_published]);

        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });

        res.status(201).json({ message: 'Created successfully' })
    } catch (error) {
        console.log(error);
        res.status(500).json( { message: 'Internal server error! '} );
    }
})

// Patch a book update
app.patch('/bookUpdate/:id', async (req,res)=> {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Field = ['title', 'author', 'ISBN', 'publisher', 'year_published', 'is_available'];

        // Get the keys of the data object
        const dataKeys = Object.keys(updates);

        // Check for illegal keys
        for (const key of dataKeys) {
            if (!Field.includes(key)) {
                return res.status(400).send(`Error: Illegal key found - "${key}"`);
            }
        }
        
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        // {"title": "BookTitle", "author": "AuthorName"}
        // 1. Object.keys(updates): -> ['title', 'author']
        // 2. .map(key => ${key} = ?): -> ['title = ?', 'author = ?']
        // 3. .join(', '): -> 'title = ?, author = ?'
        const values = Object.values(updates);
        values.push(id); // ['Title name', 'auther name', 'id']
        //DB operation
        const DBOP = await connectToSQL();
        const query = `UPDATE books SET ${fields} WHERE id = ?`
        const [results] = await DBOP.query(query, values);
        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });

        res.status(200).json({ message: 'Updated successfully', Result: `Affected Rows: ${results.affectedRows}` })
    } catch (error) {
        console.log(error);
        res.status(500).json( { message: 'Internal Server Error' } );
    }
})

// Update
app.put('/bookUpdate/:id', async (req,res)=> {
    try {
        const { id } = req.params;
        const updates = req.body;

        function CheckAllInput(ReqBody) {
            const RequiredField = ['title', 'author', 'ISBN', 'publisher', 'year_published'];
            return RequiredField.every(field=>ReqBody.hasOwnProperty(field));
        }

        if(!CheckAllInput(updates)) {
            return res.status(400).json( { message: 'Not inputed all the required field'} )
        }
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        // {"title": "BookTitle", "author": "AuthorName"}
        // 1. Object.keys(updates): -> ['title', 'author']
        // 2. .map(key => ${key} = ?): -> ['title = ?', 'author = ?']
        // 3. .join(', '): -> 'title = ?, author = ?'
        const values = Object.values(updates);
        values.push(id); // ['Title name', 'auther name', 'id']
        //DB operation
        const DBOP = await connectToSQL();
        const query = `UPDATE books SET ${fields} WHERE id = ?`
        const [results] = await DBOP.query(query, values);
        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });

        res.status(200).json({ message: 'Updated successfully', Result: `Affected Rows: ${results.affectedRows}` })
    } catch (error) {
        console.log(error);
        res.status(500).json( { message: 'Internal Server Error' } );
    }
})


// Delete a book
app.delete('/bookDelete/:id', async (req,res)=> {
    try {
        const { id } = req.params;

        //DB operation
        const DBOP = await connectToSQL();
        const query = `DELETE FROM books WHERE id = ?;`
        const [results] = await DBOP.query(query, [id]);

        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });

        res.status(200).json({ message: 'Updated successfully', Result: `Affected Rows: ${results.affectedRows}` })
    } catch (error) {
        console.log(error);
        res.status(500).json( { message: 'Internal Server Error' } );
    }
})

// Search a book - with title, author, id
app.get('/Search', async (req,res)=> {
    try {
        const keyword = req.query.keyword;
        const likeKeyword = `%${keyword}%`
        //DB operation
        const DBOP = await connectToSQL();
        const query = `SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR publisher LIKE ? OR year_published LIKE ?;`;
        const [results] = await DBOP.query(query, [likeKeyword, likeKeyword, likeKeyword, likeKeyword]);

        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });
        res.status(200).json({data: results});
    } catch (error) {
        console.log(error);
        res.status(500).json( { message: 'Internal Server Error' } );
    }
})

// User / Staff / Admin login
app.post('/login', async (req, res)=> {
    try {
        const data = req.body;
        //Check for all input
        function CheckAllInput(ReqBody) {
            const RequiredField = ['table','username', 'password'];
            return RequiredField.every(field=>ReqBody.hasOwnProperty(field));
        }
        if(!CheckAllInput(data)) {
            return res.status(400).json( { message: 'Not inputed all the required field'} )
        }

        //DB operation - check username exist
        const DBOP = await connectToSQL();
        const query = `SELECT * FROM ?? WHERE username = ?;`;
        const [results] = await DBOP.query(query, [data.table,data.username]);

        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });

       // If the user not exist
        if(results.length != 1) return res.status(404).json( { message: 'User not found!'} );

        // Check the user password with db password
        const hashresult = await hashpassword.compareHash(data.password, results[0].password); 
         if(hashresult) {
            return res.status(200).json( { message: 'Success!'} );
         } else {
            return res.status(401).json( { message: 'Username or password incorrect!'} );
         } 
    } catch (error) {
        console.log(error);
        res.status(500).json( { error: 'Internal Server Error' } );
    }
})


// Register
app.post('/register', async (req, res)=>{
    try {
        const data = req.body;
        //Check for all input
        function CheckAllInput(ReqBody) {
            const RequiredField = ['email', 'username', 'password'];
            return RequiredField.every(field=>ReqBody.hasOwnProperty(field));
        }
        if(!CheckAllInput(data)) {
            return res.status(400).json( { message: 'Not inputed all the required field'} )
        }

        //DB operation - check if the user already exist
        let DBOP = await connectToSQL();
        let query = `SELECT * FROM users WHERE username = ?;`;
        let [results] = await DBOP.query(query, [data.username]);
        
        if(results.length > 0) return res.status(409).json( { message: 'User already exist!'} );

        //DB operation - check if the email already exist

        query = `SELECT * FROM users WHERE email = ?;`;
        [results] = await DBOP.query(query, [data.email]);
       
        if(results.length > 0) return res.status(409).json( { message: 'Email already has been taken!'} );

        //Hash the password
        const hashedPassword = await hashpassword.hashPassword(data.password);

        //DB operation - add a new user

        query = `INSERT INTO users (username, password, email) VALUES (?, ?, ?);`;
        [results] = await DBOP.query(query, [data.username ,hashedPassword, data.email]);

        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });

        return res.status(200).json( { message: 'Register successful!'} );

    } catch (error) {
        console.log(error);
        res.status(500).json( { error: 'Internal Server Error' } );
    }
})

//update user information but password
app.patch('/updateUser/:username', async (req, res)=> { 
    try {
        const { username } = req.params; // get it by jwt token
        const updates = req.body;
        if(!req.body) {
            res.status(400).json({message: 'Please make a change on profile.'});
        }
        //DB operation - check if the user already exist by using jwt token from front end server
        let DBOP = await connectToSQL();
        let query = `SELECT id FROM users WHERE username = ?;`;
        let [results] = await DBOP.query(query, [username]);

        if(results.length != 1) return res.status(404).json( { message: 'User not found!'} );

        //Check if the property is conflict
        const { email = null, username: newUsername = null } = updates;
        let conflictMessage = '';

        if (newUsername) {
            // Check if new username already exists
            query = `SELECT id FROM users WHERE username = ? AND id != ?;`;
            let [usernameCheck] = await DBOP.query(query, [newUsername, results[0].id]);
            if (usernameCheck.length > 0) {
                conflictMessage += 'Username is already taken. ';
            }
        }

        if (email) {
            // Check if new email already exists
            query = `SELECT id FROM users WHERE email = ? AND id != ?;`;
            let [emailCheck] = await DBOP.query(query, [email, results[0].id]);
            if (emailCheck.length > 0) {
                conflictMessage += 'Email is already in use.';
            }
        }

        // If there are conflicts, return a 409 status with the conflict message
        if (conflictMessage) {
            return res.status(409).json({ message: conflictMessage.trim() });
        }

        // Update the user information by id
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(results[0].id); 

        query = `UPDATE users SET ${fields} WHERE id = ?`;
        [results] = await DBOP.query(query, values);
        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });
        res.status(200).json( { message: "User information has been updated"} );

    } catch (error) {
        if(error.errno && error.errno === 1062) {
            res.status(409).json( { error: "This username has been used by other user" } );
        } else {
            console.log(error);
            res.status(500).json( { error: error.message } );
        }
    }
})

// Password change for user/staff
app.patch('/changePassword', async (req, res)=> {
    try {
        const data = req.body;
        //Check for all input
        function CheckAllInput(ReqBody) {
            const RequiredField = ['table', 'username', 'password', 'new_password'];
            return RequiredField.every(field=>ReqBody.hasOwnProperty(field));
        }
        if(!CheckAllInput(data)) {
            return res.status(400).json( { message: 'Not inputed all the required field'} )
        }

        

        //DB operation - check if the user already exist by using jwt token from front end server
        let DBOP = await connectToSQL();
        let query = `SELECT id, password FROM ?? WHERE username = ?;`;
        let [results] = await DBOP.query(query, [data.table, data.username]);
        if(results.length === 0) return res.status(404).json( { message: 'User not found!'} );

        // Check the old password with db
        const hashresult = await hashpassword.compareHash(data.password, results[0].password); // true = password matched
        if(!hashresult) {
            return res.status(401).json( { message: 'The password is not correct!'} )
        }

        // Hash the new password
        const hashedPassword = await hashpassword.hashPassword(data.new_password);

        // Check the new password is same as old password in db
        const Newhashresult = await hashpassword.compareHash(data.new_password, results[0].password); // true = new password is equal to old password
        if(Newhashresult) {
            return res.status(401).json( { message: 'The new password is same before!'});
        }

        // DB operation - update new password
        query = `UPDATE ?? SET password = ? WHERE username = ?;`;
        [results] = await DBOP.query(query, [data.table, hashedPassword,data.username]);
        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });
        res.status(200).json( { message: results} );
        
    } catch (error) {
        console.log(error);
        res.status(500).json( { error: error.message } );
    }
})


// Admin insert new staff
app.post('/insertstaff', async (req, res)=> {
    try {
        const data = req.body;
        //Check for all input
        function CheckAllInput(ReqBody) {
            const RequiredField = ['username', 'fullname', 'password'];
            return RequiredField.every(field=>ReqBody.hasOwnProperty(field));
        }
        if(!CheckAllInput(data)) {
            return res.status(400).json( { message: 'Not inputed all the required field'} )
        }

        // Hash the password
        const hashedpassword = await hashpassword.hashPassword(data.password);

        // Check the staff is already exist by full name
        let DBOP = await connectToSQL();
        let query = `SELECT * FROM staff WHERE fullname = ?`;
        let [results] = await DBOP.query(query, [data.fullname]);
        if(results.length > 0) {
            return res.status(409).json( { message: 'The full name already exist'} )
        }

        // Check the staff is already exist by username
        DBOP = await connectToSQL();
        query = `SELECT * FROM staff WHERE username = ?`;
        [results] = await DBOP.query(query, [data.username]);
        if(results.length > 0) {
            return res.status(409).json( { message: 'The username already exist'} )
        }

        // Insert the staff
        query = `INSERT INTO staff (username, fullname, password) VALUES (?, ?, ?);`;
        [results] = await DBOP.query(query, [data.username, data.fullname, hashedpassword]);
        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing
        });
        res.status(200).json( { message: 'A new staff has been inserted', result: results} );
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
})

// admin delete staff
app.delete('/deletestaff', async (req, res)=> {
    try {
        const data = req.body;
        //Check for all input

        function CheckAllInput(ReqBody) {
            const RequiredField = ['username', 'fullname'];
            return RequiredField.every(field=>ReqBody.hasOwnProperty(field));
        }
        if(!CheckAllInput(data)) {
            return res.status(400).json( { message: 'Not inputed all the required field'} )
        }

        
        // Check the staff is already exist by full name
        let DBOP = await connectToSQL();
        let query = `SELECT id FROM staff WHERE fullname = ? AND username = ?`;
        let [results] = await DBOP.query(query, [data.fullname, data.username]);
        if(results.length === 0) {
            return res.status(409).json( { message: 'The staff does not exist'} )
        }
 
        const staffId = results[0].id;
        // Insert the staff
        query = `DELETE FROM staff WHERE id = ?`;
        [results] = await DBOP.query(query, [staffId]);
        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing

        });
        res.status(200).json( { message: 'A staff of id:' + staffId + ' has been deleted.'} );
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
})

// admin change staff password
app.patch('/passwordchange', async (req, res)=> {
    try {
        const data = req.body;
        //Check for all input
        function CheckAllInput(ReqBody) {
            const RequiredField = ['username', 'fullname', 'new_password'];
            return RequiredField.every(field=>ReqBody.hasOwnProperty(field));
        }
        if(!CheckAllInput(data)) {
            return res.status(400).json( { message: 'Not inputed all the required field'} )
        }

        // Hash the password
        const hashedpassword = await hashpassword.hashPassword(data.new_password);

        // Check the staff is already exist by full name
        let DBOP = await connectToSQL();
        let query = `SELECT id FROM staff WHERE fullname = ? AND username = ?`;
        let [results] = await DBOP.query(query, [data.fullname, data.username]);
        if(results.length === 0) {
            return res.status(409).json( { message: 'The staff does not exist'} )
        }
 
        const staffId = results[0].id;
        // Insert the staff
        query = `UPDATE staff SET password = ? WHERE id = ?`;
        [results] = await DBOP.query(query, [hashedpassword, staffId]);
        await DBOP.end(function(err) {
            if (err) throw err; // Handle any errors during closing

        });
        res.status(200).json( { message: 'A staff\'password of id:' + staffId + ' has been updated.'} );
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
})


// Start the server
app.listen(5000, () => {
    console.log('Backend server running on port 5000');
});