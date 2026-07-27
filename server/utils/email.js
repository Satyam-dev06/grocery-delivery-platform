const nodemailer = require("nodemailer");
let transporter;
function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = {
      sendMail: async (m) => { console.log("[EMAIL LOG]",JSON.stringify({to:m.to,subject:m.subject})); return {messageId:"log-"+Date.now()}; },
    };
  }
  return transporter;
}

function tpl(body, bg, title) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:0}.c{max-width:600px;margin:0 auto;padding:20px}.h{background:'+bg+';color:#fff;padding:30px;text-align:center;border-radius:8px 8px 0 0}.h h1{margin:0}.b{background:#fff;padding:30px;border-radius:0 0 8px 8px}.f{text-align:center;color:#999;font-size:12px;margin-top:20px}.btn{display:inline-block;background:'+bg+';color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px}</style></head><body><div class="c"><div class="h"><h1>'+title+'</h1></div><div class="b">'+body+'</div><div class="f"><p>GroceryHub</p></div></div></body></html>';
}

const TEMPLATES = {
  welcome: (n) => ({subject:"Welcome!",html:tpl("<h2>Hi "+n+"!</h2><p>Thank you for joining! Start shopping now.</p><a href='http://localhost:5000' class='btn'>Shop</a>","#2E7D32","Welcome!")}),
  orderConfirmation: (n,oid,total) => ({subject:"Order Confirmed #"+oid,html:tpl("<h2>Thanks "+n+"!</h2><p>Order #"+oid+" placed. Total: "+total+"</p><a href='http://localhost:5000/orders.html' class='btn'>View</a>","#1976D2","Confirmed")}),
  paymentSuccess: (n,amt) => ({subject:"Payment Successful",html:tpl("<h2>Hi "+n+"!</h2><p>Payment of "+amt+" succeeded.</p>","#2E7D32","Paid")}),
  paymentFailed: (n,amt) => ({subject:"Payment Failed",html:tpl("<h2>Hi "+n+"</h2><p>Payment of "+amt+" failed.</p><a href='http://localhost:5000/orders.html' class='btn'>Retry</a>","#E53935","Failed")}),
  orderDelivered: (n,oid) => ({subject:"Delivered! #"+oid,html:tpl("<h2>Hi "+n+"!</h2><p>Order #"+oid+" delivered!</p><a href='http://localhost:5000/orders.html' class='btn'>Review</a>","#2E7D32","Delivered!")}),
  couponReceived: (n,code,disc) => ({subject:"Coupon for You!",html:tpl("<h2>Hi "+n+"!</h2><p>Code: <strong>"+code+"</strong></p><p>"+disc+"</p><a href='http://localhost:5000' class='btn'>Shop</a>","#E65100","Coupon!")}),
};

async function sendEmail(opts) {
  try {
    const t = getTransporter();
    const m = { from: process.env.SMTP_FROM||"noreply@groceryhub.com" };
    if (opts.template && TEMPLATES[opts.template]) {
      const tp = TEMPLATES[opts.template](...(opts.templateData||[]));
      m.subject = tp.subject; m.html = tp.html;
    } else { m.subject = opts.subject||"Notification"; m.html = opts.html||""; }
    m.to = opts.to;
    const info = await t.sendMail(m);
    console.log("Email:", info.messageId);
    return true;
  } catch(e) { console.error("Email error:", e.message); return false; }
}

module.exports = { sendEmail, TEMPLATES };
