  /*
Author: Aden Molina
Description: This is the script for the server which handles incoming requests through the various routes. It will display the products, process and display invoice, as well as, data validation and inventory tracker. 
*/

var express = require('express');
var myParser = require("body-parser");
var fs = require('fs');
var filename = "./user_data.json";
var queryString = require("query-string");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var qs = require('qs');
var url = require('url');
var nodemailer = require("nodemailer");
var products = require('./products.json');
var http = require('http');
console.log(products);
//products.forEach( (prod,i) => {prod.total_sold = 0});

const { response } = require('express');

var app = express();
var errors={};

app.use(myParser.urlencoded({ extended: true }));
app.use(myParser.json());
app.use(cookieParser());
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

if (fs.existsSync(filename)) {
    data = fs.readFileSync(filename, 'utf-8');
    user_data = JSON.parse(data); //turns data into string
    fileStats = fs.statSync(filename);
    console.log("File " + filename + " has been properly loaded containing " + fileStats.size + " characters");
}
else {
    console.log("Please enter a correct filename.");
}

// monitor all requests
app.all('*', function (request, response, next) {
    if (typeof request.session.cart == "undefined") {
        request.session.cart = {}; // initialize cart
    }
    next();
});

// ------ Load In Product Data ----- //
app.post("/get_products_data", function (request, response, next) {
    response.json(products);
});

function isNonNegInt(q, return_errors = false) {
    errors = []; // assume no errors at first
    if(q == '') q = 0; // handle blank inputs as if they are 0
    if (Number(q) != q) errors.push('<font color="red">Not a number!</font>'); //alerts user if value is not a number
    else if (q < 0) errors.push('<font color="red">Negative value!</font>'); //alerts user if value is negative
    else if (q > 15) errors.push('<font color="red">Only 15 in stock</font>'); //alerts user if order is too big
    else if (parseInt(q) != q) errors.push('<font color="red">Not an integer!</font>'); //alerts user if value is not an interger
    return return_errors ? errors : (errors.length == 0); // return these errors
}

function checkQuantityTextbox(theTextbox) { 
    errs = isNonNegInt(theTextbox.value, true); //if the value of textbox is true, then it is assigned to errs
    if (errs.length == 0) errs = ['You want:']; //if the length of errs is equal to 0, then display 'You want:'
    if (theTextbox.value.trim() == '') errs = ['Quantity']; //if there is no value in the texbox, display 'Quantity:'
    document.getElementById(theTextbox.name + '_label').innerHTML = errs.join(", ");
}




// ------ Process order from products_display ----- //
app.post('/add_to_cart', function (request, response) {
    let POST = request.body; // create variable for the data entered into products_display
    var qty = POST["prod_qty"];
    console.log(qty);
    var ptype = POST["prod_type"];
    console.log(ptype);
    var pindex = POST["prod_index"];
    console.log(pindex);
    if (isNonNegInt(qty)) {
        // Add qty data to cart session
        if (typeof request.session.cart[ptype] == "undefined") {
            request.session.cart[ptype] = [];
        }
        request.session.cart[ptype][pindex] = parseInt(qty);
        response.json({ "status": "Successfully Added to Cart" });
    } else {
        response.json({ "status": "Invalid quantity, Not added to cart" });
    }
});
 
    
// ------ Get info from session (shopping cart data) ----- //
app.post('/get_cart', function (request, response) {
    response.json(request.session.cart);
});
// ------ Get info from session (shopping cart data) ----- //

// ------ Update session info/shopping cart with new quantities ----- //
app.post("/update_cart", function (request,response) {
    // replace cart in session with post
    // check if updated quantities are valid
    let haserrors = false;
    for (let ptype in request.body.quantities) {
        for (let i in request.body.quantities[ptype]) {
            qty = request.body.quantities[ptype][i];
            haserrors = !isNonNegInt(qty) || haserrors; // Flag -> once haserrors true, always true
        };
    };
    if (haserrors == true) { // if there are errors, send error msg
        msg = "Invalid quantities. Cart not updated";
    } else { // if there are no errors, update cart
        msg = "Cart successfully updated!";
        request.session.cart = request.body.quantities;
        Number(qty) -= products[i].quantity ;
        console.log(Number(qty));
    }
    var ref_URL = new URL(request.get('Referrer'));
    ref_URL.searchParams.set("msg", msg); // get qs and add to qs
    response.redirect(ref_URL.toString());
});
// ------ End update session info/shopping cart with new quantities ----- //





app.get("/login", function (request, response) {

let params = new URLSearchParams(request.query);

var contents = fs.readFileSync('./views/login.html', 'utf8');
response.send(eval('`' + contents + '`')); // render template string

//<form action="?${params.toString()}" method="POST">

    function display_login() {
    str = `
    <body>
    <div class="container">
      <div class="title"><h1 style="text-align: center;">Login</h1></div>
      <p style="text-align: center;">Please fill in the information below to log in.</p>

      <div class="content">
      <form action="?${params.toString()}" method="POST">
          <div class="user-details">
            <div class="input-box">
              <span class="details">Username</span>
              <input type="text" name="username" required minlength="4" maxlength="8" size="40" placeholder="Enter your Username" > 
              ${ (typeof errors['no_username'] != 'undefined')?errors['no_username']:''}
            </div>
            <div class="input-box">
              <span class="details">Password</span>
              <input type="password" name="password" required minlength="6" size="40" placeholder="Enter Password"><br />
              ${ (typeof errors['wrong_password'] != 'undefined')?errors['wrong_password']:''}
              </div>
          </div>
          </div>
          <div class="button">
          <input type="submit" value="Login!" id="submit">

          </div>
          </form>
          </body>
        `;
        return str;
    }
    });
    
    app.post("/login", function (request, response, next) {
        // Process login form POST and redirect to logged in page if ok, back to login page if not
        username = request.body.username.toLowerCase(); // Username as all lower case
        if (typeof user_data[username] != 'undefined') { // Check if username entered exists in user data
            if (user_data[username].password == request.body.password) { // Check if password entered matches password in user data
                request.body.name = user_data[username].name;
                request.body.email = user_data[username].email;
                request.session['username'] = username;
                request.session['email'] = user_data[username].email;
                request.session['full_name'] = user_data[username].name;
                console.log(request.session);
    
                response_string = `<script>
                alert('${username} Login Successful!');
                location.href = "${'./invoice.html?' + qs.stringify(request.query)}";
                </script>`;
                var user_info = {"username": username, "name": user_data[username].name,"email": user_data[username].email};
                response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });
                response.send(response_string); // If no errors found, redirect to invoice with query string of username information and products
                return;
            } else { // If password is not entered correctly, send error alert
                request.query.username = username;
                request.query.name = user_data[username].name;
                errors['wrong_password'] = `Wrong Password!`;
            }
        } else { // If username entered is not found in user data, send error alert;
            errors['no_username'] = `You need to select a username!`;
        }
        response.redirect('./login?'); // If there are errors, redirect to same page
    });

//processes logout
app.get("/logout" , function (request, response) {
    
    if (typeof request.cookies["user_info"] == 'undefined' ){
        console.log('no user');
        response.redirect('./display_products.html');
    } else {
        var user_info = JSON.parse(request.cookies["user_info"]);
        var username = user_info["username"];
        logout_msg = `<script>alert('${username} has successfully logged out!'); location.href="./index.html";</script>`;
        response.clearCookie('user_info');
        response.send(logout_msg); 
    }
   
});





app.post("/register", function (request, response,next) {
    var errors = [];
    let POST = request.body;

    // -------------- Full name validation -------------- //
    // Full name only allow letters
    if (/^[A-Za-z]+ [A-Za-z]+$/.test(request.body.fullname) == false) {
        errors.push('Only letter characters allowed for Full Name');
        console.log('Only letter characters allowed for Full Name');

    }

    // Full name maximum character length is 30
    if ((request.body.fullname.length > 30 || request.body.fullname.length < 1)) {
        errors.push('Full Name must contain Maximum 30 Characters');
        console.log('Full Name must contain Maximum 30 Characters');

    }

    // -------------- Username validation -------------- //
    // Username all lowercase (case insensitive)
    username = request.body.username.toLowerCase();

    // Check if username is in user data. If so, push username taken error
    if (typeof user_data[username] != 'undefined') {
        errors.push('Username taken');
        console.log('Username taken');

    }
    // Username only allow letters and numbers
    if (/^[0-9a-zA-Z]+$/.test(request.body.username) == false) {
        errors.push('Only Letters And Numbers Allowed for Username');
        console.log('Only Letters And Numbers Allowed for Username');

    }
    // Username minimum character length is 4 maximum character length is 10
    if ((request.body.username.length > 10 || request.body.username.length < 4)) {
        errors.push('Username must contain at least 4 characters and a maximum of 10 characters');
        console.log('Username must contain at least 4 characters and a maximum of 10 characters');

    }

    // -------------- Email validation -------------- //
    // Email only allows certain character for x@y.z
    if (/[A-Za-z0-9._]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(request.body.email) == false) {
        errors.push('Must enter a valid email (username@mailserver.domain).');
        console.log('Must enter a valid email (username@mailserver.domain).');

    }

    // -------------- Password validation -------------- //
    // Password minumum 6 characters // 
    if (request.body.password.length < 6) {
        errors.push('Password Minimum 6 Characters');
        console.log('Password Minimum 6 Characters');
    }
    // -------------- Repeat Password validation -------------- //
    // Check if password matches repeat password
    if (request.body.password !== request.body.repeat_password) {
        errors.push('Passwords Do Not Match');
        console.log('Passwords Do Not Match');
    }

    // Borrowed some code from Lab 14 // 
    // If there are no errors, save info to user data
    if (errors.length == 0) {
        POST = request.body
        var username = POST['username']
        user_data[username] = {}; // Register it as user's information
        user_data[username].name = request.body.fullname; // POST user's name
        user_data[username].password = request.body.password; // POST user's password
        user_data[username].email = request.body.email; // POST user's email
        data = JSON.stringify(user_data);
        fs.writeFileSync(filename, data, "utf-8"); // Add new user to user data json file
        request.query.name = user_data[username].name;
        request.query.email = user_data[username].email;
        response_string = `<script>alert('${user_data[username].name} Registration Successful!');
        location.href = "${'./invoice.html?' + qs.stringify(request.query)}";
        </script>`;
        var user_info = {"username": username, "name": user_data[username].name, "email": user_data[username].email};
        response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });
        response.send(response_string);
        // If no errors, send window alert success
    }
    // If there are errors redirect to registration page & keep info in query string
    if (errors.length > 0) {
        request.query.fullname = request.body.fullname;
        request.query.username = request.body.username;
        request.query.email = request.body.email;
        // Add errors to query string
        request.query.errors = errors.join(';');
        response.redirect('register.html' + qs.stringify(request.query));
    }
});

app.post('/cart_qty', function (request, response) {
    var total = 0;
    for (pkey in request.session.cart) {
        total += request.session.cart[pkey].reduce((a, b) => a + b, 0);
    }
    response.json({"qty": total});
});


// ------ Complete purchase -> email invoice ----- //
app.post('/completePurchase', function (request, response) {
    var invoice = request.body;
    var user_info = JSON.parse(request.cookies["user_info"]);
    var the_email = user_info["email"];
    console.log(the_email);

    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 25,
        secure: false, // Use TLS
        tls: {
            // Invalid Certifications
            rejectUnauthorized: false
        }, 
        auth:{
            user:'adenitm352@gmail.com',
            pass:'PleaseWork808'
        }
    });
    var mailOptions = {
        from: 'adenitm352@gmail.com',
        to: the_email,
        subject: 'Adens CDs Invoice',
        html: invoice.invoicehtml
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            status_str = 'There was an error and your invoice could not be emailed :(';
            console.log(error );
        } else {
            status_str = `Your invoice was mailed to ${the_email}`;
            console.log(status_str );
        }
        response.json({ "status": status_str });
    });
    request.session.destroy();
});


    
    var listener = app.listen(8080, () => { console.log('server started listening on port ' + listener.address().port) });
// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8081, () => console.log(`listening on port 8080`));