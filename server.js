const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const cors = require('cors');
const checksum_lib = require('./crypt/checksum');

app.use(cors());
app.use(bodyParser.json());

app.use(express.static('./frontend'));

app.use(bodyParser.urlencoded({ extended: false }))
var instance = new Razorpay({
    key_id: 'rzp_live_5loegCdbmTtSy6',
    key_secret: '2lJNXitXII4SY9hPFfAX52KW',
});

app.get('/', (req, res) => {
    res.sendFile("frontend/index.html", { root: __dirname })
})

app.post('/', (req, res) => {
  res.sendFile("frontend/index.html", { root: __dirname })
})

app.post('/create/orderId/razorpay', (req, res) => {
console.log("called")
    console.log("api called")
    let amt = req.body.amount+'00';
    console.log(amt)
      var options = {
          amount: amt,  
          currency: "INR",
          receipt: "rcp1"
        };
    instance.orders.create(options, function(err, order) {
      console.log(order);
      res.send({
          orderId: order.id
      })
    });
})

app.post("/api/payment/verify",(req,res)=>{
console.log("verify api")
    let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
   
     var crypto = require("crypto");
     var expectedSignature = crypto.createHmac('sha256', 'Wok5mJv2F0pa5HKLeXZfUr9r')
        .update(body.toString())
        .digest('hex');
        console.log("sig received " ,req.body.response.razorpay_signature);
        console.log("sig generated " ,expectedSignature);
     var response = {"signatureIsValid":"false"}
     if(expectedSignature === req.body.response.razorpay_signature)
      response={"signatureIsValid":"true"}
         res.send(response);
     });

// For Staging 

app.post('/create/orderId/paytm', (req, res) => {
  console.log("api called paynow")

    var paymentDetails = {
      amount: req.body.amount,
      customerId: req.body.customerId,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone
  }

  console.log(paymentDetails.amount,paymentDetails.customerId,paymentDetails.customerEmail,paymentDetails.customerPhone)
  if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
      res.status(400).send('Payment failed')
  } else {
      var params = {};
      params['MID'] =  "rtFYvm43539503419298";
      params['WEBSITE'] = "WEBSTAGING";
      params['CHANNEL_ID'] = 'WEB';
      params['INDUSTRY_TYPE_ID'] = 'Retail';
      params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
      params['CUST_ID'] = paymentDetails.customerId;
      params['TXN_AMOUNT'] = paymentDetails.amount;
      params['CALLBACK_URL'] = `http://localhost:4000/callback/${params['ORDER_ID']}`
      params['EMAIL'] = paymentDetails.customerEmail;
      params['MOBILE_NO'] = paymentDetails.customerPhone;
  
      checksum_lib.genchecksum(params, "mD72XUDCC62Dshq0", function (err, checksum) {
        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; 

        var form_fields = "";
        for (var x in params) {
            form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
        
        res.send({
          order: '<body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body>'
        });
    });
  }
})

const https = require("https");
const qs = require("query-string");
const PaytmChecksum = require('./PaytmChecksum');

app.post("/callback/:order", (req, res) => {

  var paytmParams = {};
  paytmParams.body = {
    "mid" : "rtFYvm43539503419298",
    "orderId" : req.params.order,
  };

  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), "mD72XUDCC62Dshq0").then(function(checksum){
 
    paytmParams.head = {
      "signature"	: checksum
    };

    var post_data = JSON.stringify(paytmParams);
  
    var options = {
      hostname: 'securegw-stage.paytm.in',
      port: 443,
      path: '/v3/order/status',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': post_data.length
      }
    };
    var response = "";
    var post_req = https.request(options, function(post_res) {
      post_res.on('data', function (chunk) {
          response += chunk;
      });

      post_res.on('end', function(){
        console.log('Response: ', response);
        var _result = JSON.parse(response);
        console.log(_result.body.resultInfo.resultStatus)
          if(_result.body.resultInfo.resultStatus== 'TXN_SUCCESS') {
          res.sendFile("frontend/success.html", { root: __dirname })
          }else {
          res.sendFile("frontend/failed.html", { root: __dirname })
          }
      });
    });
    post_req.write(post_data);
    post_req.end();
  });
});

app.listen(PORT, () => {
  console.log(`app listening at http://localhost:4000/:${PORT}`)
})