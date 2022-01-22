let orderId ;
function razorpay(totalamt, name, email, phn) {
    let options = {
        "key": "rzp_live_5loegCdbmTtSy6", // Enter the Key ID generated from the Dashboard
        "amount": totalamt+'00', // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Testing",
        "description": "Testing Payment",
        "image": "https://example.com/your_logo",
        "order_id": orderId, 
        "handler": function (response){
            alert(response.razorpay_payment_id);
            alert(response.razorpay_order_id);
            alert(response.razorpay_signature)
            let settings = {
                "url": "http://localhost:4000/api/payment/verify",
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify({response}),
            }
        },
        "prefill": {
            "name": name,
            "email": email,
            "contact": phn
        },
        "theme": {
        "color": "#3399cc"
        },
    }

    let rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
        alert(response.error.code);
        alert(response.error.description);
    });
    rzp1.open();
    e.preventDefault();
}

document.getElementById('rzp-button1').onclick = async function(e){
    let pay = $('#pay-opt option:selected').val();
    console.log(pay)
    let qty = document.getElementById('totalqty').value
    let amt = document.getElementById('amt').value
    let totalamt = eval(Number(qty) * Number(amt))
    let name = document.getElementById('name').value
    let email = document.getElementById('email').value
    let phn = document.getElementById('phone').value
    let catOpt = $('#catOpt option:selected').val();
    if(totalamt > 0) {
        if(!name || ! phn || !email) {
            alert("Please enter valid details")
        }
        else {
            if(pay == 'RazorPay') {
                $.ajax({
                    url: `/create/orderId/razorpay`,
                    type: "POST",
                    data: {
                        amount: totalamt
                    },
                    dataType: 'json',
                    success: function(){
                        alert(`you are buying ${catOpt} and you total amount is ${totalamt} and confirm pay with ${pay}`);            
                        razorpay(totalamt, name, email, phn) 
                    }
                })
            }
        
            else if(pay == 'PayTm') {
                console.log("pay is paytm")
                alert(`you are buying ${catOpt} and you total amount is ${totalamt} and confirm pay with ${pay}`);  
                $.ajax({
                    url: `/create/orderId/paytm`,
                    type: "POST",
                    data: {
                        amount: totalamt,
                        customerId: name,
                        customerEmail: email,
                        customerPhone: phn
                    },
                    dataType: 'json',
                    success: function(data){
                        $('body').replaceWith(data.order)
                    }
                })
            }
        }
    }
    else {
        alert("Please enter a vaild qty or amount.")
    }
};

