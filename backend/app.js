const express = require('express');
const user = require('./route/user');
const path = require('path')
const app = express();

app.all("*", function(req, res, next) {
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin", "*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, User");
    //跨域允许的请求方式 
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() == 'options')
        res.send(200); //让options尝试请求快速结束
    else
        next();
});

app.use(express.static(path.join(__dirname,'public')))

app.use('/user', user);

app.get('/', (req, resp) => {
    resp.send('welcome to nodejs!')
});
app.listen(8889);