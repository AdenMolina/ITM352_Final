/*
Author: Aden Molina
Date: 01 March 2021
Description: This is the script for the server which handles incoming requests through the various routes. It will display the products, process and display invoice, as well as, data validation and inventory tracker. 
*/

var express = require('express');
var myParser = require("body-parser");
var fs = require('fs');
var filename = "./user_data.json";
var queryString = require("query-string");

var products_array = require('./products.json');
products_array.forEach( (prod,i) => {prod.total_sold = 0});

const { response } = require('express');

var app = express();

app.use(myParser.urlencoded({ extended: true }));




// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
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



//From Assignment1_MVC_server, displays products
app.get("/store", function (request, response) {
    var contents = fs.readFileSync('./views/display_products.html', 'utf8');
    response.send(eval('`' + contents + '`')); // render template string

// function will display products
    function display_products() {
        str = '';

        for (i = 0; i < products_array.length; i++) {
            str += `
                <section class="item">
                    <h2>${products_array[i].album}</h2>
                    <h3>${products_array[i].artist}</h3>
                    <img src="${products_array[i].image}">
                    <h3>$${products_array[i].price}</h3>
                    <label id="quantity${i}_label"}">Quantity:</label>
                    <div class="box">
                    <input type="number" placeholder="Enter a Quantity"  name="quantity${i}" 
                     required min="0" max="15" onkeyup="checkQuantityTextbox(this); ">
                    </div>
                    <div class="Inventory">
                    <h3>${products_array[i]["total_sold"]} ${products_array[i]["album"]} have been sold!</h3>
                    </div>
                </section>
            `;
        }
        return str;
    }

});   
//From Assignment1_MVC_server, creates invoice
app.post("/process_invoice", function (request, response, next) {
    let POST = request.body;
    if (typeof POST['purchase_submit'] == 'undefined') {
        console.log('No purchase form data');
        next();
    } 
    
    console.log(Date.now() + ': Purchase made from ip ' + request.ip + ' data: ' + JSON.stringify(POST));

    var contents = fs.readFileSync('./views/invoice.html', 'utf8');
    response.send(eval('`' + contents + '`')); // render template string


    function display_invoice_table_rows() { //function to create invoice 
        subtotal = 0; //asume subtotal is zero
        str = ''; 
        for (i = 0; i < products_array.length; i++) {
            a_qty = 0; 
            if(typeof POST[`quantity${i}`] != 'undefined') { // if statement to see if posted value is not equals to undefined
                a_qty = POST[`quantity${i}`]; //if it is true, the value is assined to a_qty
            }
            if (a_qty > 0) { // if statement to see if a_qty is greater than 0, creates product row
                extended_price =a_qty * products_array[i].price //extended price is a_qty mulitplied by price of producct
                subtotal += extended_price; // subtotal is equals to subtotal plus extended price
                //adapted from Lab 13, exercise 5
                products_array[i]['total_sold'] += Number(a_qty); //attribute: total sold is equals to number of a_qty plus attribute: total sold
                str += (`
      <tr>
        <td width="43%">${products_array[i].album}</td>
        <td align="center" width="11%">${a_qty}</td>
        <td width="13%">\$${products_array[i].price}</td>
        <td width="54%">\$${extended_price}</td>
      </tr>
      <div class="Inventory">
      <h3>${products_array[i]["total_sold"]} ${products_array[i]["album"]} have been sold!</h3>
      <div>

      `);
            }
        }
        // Compute tax
        tax_rate = 0.0575;
        tax = tax_rate * subtotal;

        // Compute shipping
        if (subtotal <= 50) {
            shipping = 2;
        }
        //if subtotal is greater than or equal to 100, then shipping is $5
        else if (subtotal <= 100) {
            shipping = 5;
        }
        else {
            shipping = 0.05 * subtotal; // 5% of subtotal
        }

        // Compute grand total
        total = subtotal + tax + shipping;
        
        return str;
    
    }
 
});
app.get("/login", function (request, response) {
var contents = fs.readFileSync('./views/login.html', 'utf8');
response.send(eval('`' + contents + '`')); // render template string


    function display_login() {
    str = `
    <body>
    <form action="" method="POST">
    <input type="text" name="username" size="40" placeholder="enter username" ><br />
    <input type="password" name="password" size="40" placeholder="enter password"><br />
    <input type="submit" value="Submit" id="submit">
    </form>
    </body>
        `;
    response.send(str);
    }
    });
    
    app.post("/login", function (request, response) {
        // Process login form POST and redirect to logged in page if ok, back to login page if not
        the_username = request.body['username'].toLowerCase();
        the_password = request.body['password'];
        if (typeof users_reg_data[the_username] != 'undefined') {
            if (users_reg_data[the_username].password == the_password) {
                response.send(`User ${the_username} is logged in`);
            } else {
                response.send(`Wrong password!`);
            }
            return;
        }
        response.send(`${the_username} does not exist`);
    });
    // user info JSON file


if (fs.existsSync(filename)) {
    var stats = fs.statSync(filename);
    data = fs.readFileSync(filename, 'utf-8');
    users_reg_data = JSON.parse(data);
} else {
    console.log(filename + ' does not exist!');
    users_reg_data = {};
}

app.get("/register", function (request, response) {
// Give a simple register form
        str = `
<body>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" > 
${ (typeof errors['no_username'] != 'undefined')?errors['no_username']:''}
${ (typeof errors['username_taken'] != 'undefined')?errors['username_taken']:''}
<br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="password" name="repeat_password" size="40" placeholder="enter password again">
${ (typeof errors['password_mismatch'] != 'undefined')?errors['password_mismatch']:''}
<br />
<input type="email" name="email" size="40" placeholder="enter email"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
    
});

app.post("/register", function (request, response) {
    // process a simple register form
    username = request.body.username.toLowerCase();

    // check is username taken
    if(typeof users_reg_data[username] != 'undefined') {
        errors['username_taken'] = `Hey! ${username} is already registered!`;
    }
    if(request.body.password != request.body.repeat_password) {
        errors['password_mismatch'] = `Repeat password not the same as password!`;
    } 
    if(request.body.username == '') {
        errors['no_username'] = `You need to select a username!`;
    }
    if(Object.keys(errors).length == 0) {
        users_reg_data[username] = {};
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;
        fs.writeFileSync(filename, JSON.stringify(users_reg_data));
        console.log("Saved: " + users_reg_data);
        response.send(`${username} has been registered.`);
    } else {
        response.redirect("./register");
    }
});

    
    var listener = app.listen(8080, () => { console.log('server started listening on port ' + listener.address().port) });
// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));