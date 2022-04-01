// Borrowed code from Assignment 3 examples

function loadJSON(service, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('POST', service, false);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return false;
  }



function navbar() {
    var cart_qty;
    loadJSON('./cart_qty', function (response) {
        // Parsing JSON string into object
        cart_qty = JSON.parse(response);
    });
    if (getCookie('user_info') != false) {
        var user_info = JSON.parse(getCookie('user_info'));
        console.log(user_info);
        document.write(`
    <ul>
        <li><a href="./display_products.html">Home</a></li>
        <li><a href="./invoice.html${location.search}">Cart(${cart_qty.qty})</a></li>
        <li><a href="./login${location.search}">Login</a></li>
        <li><a href="./register.html${location.search}">Registration</a></li>
        
        <div class ="toright">
        <li>Welcome, ${user_info["username"]}!</li>
        <li><a href="./logout">Logout</a></li>
        </div>

       
    `); // If the user has a cookie called "user_info", welcome them by name
      } else {
        document.write(`
        <ul>
            <li><a href="./display_products.html">Home</a></li>
            <li><a href="./invoice.html${location.search}">Cart(${cart_qty.qty})</a></li>
            <li><a href="./login${location.search}">Login</a></li>
            <li><a href="./register.html${location.search}">Registration</a></li>
            
            <div class ="toright">
            <li>no user</li>
            <li><a href="./logout">Logout</a></li>
            </div>
    
           
        `);
      };
    for (let product_key in allproducts) {
        if (product_key == this_product_key); // if product key that currently at is there, continue
        document.write(`<li><a href='./display_products.html?product_key=${product_key}'>${product_key}</a></li>`);
    }
    document.write(`
    </ul>
    `);
}