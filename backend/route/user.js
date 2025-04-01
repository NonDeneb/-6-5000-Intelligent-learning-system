const express = require('express');
const jwt = require('jsonwebtoken');
const bodyparser = require('body-parser');
const neo4j = require('neo4j-driver');
const questionInfo = require('./mathresource/questionInfo');
const paperInfo = require('./mathresource/paperInfo');
const homeworkInfo = require('./mathresource/homeworkInfo')
const knowledgeManagement = require('./knowledgemanagement/knowledgeManagement')

const neo4jurl = 'bolt://121.37.215.152:7687';
const neo4juser = 'neo4j';
const neo4jpsw = 'jiebin123';
const driver = neo4j.driver(neo4jurl, neo4j.auth.basic(neo4juser, neo4jpsw));

const user = express.Router();

user.use(bodyparser.urlencoded({ extended: false }));
user.use(bodyparser.json());
user.use('/questionInfo', questionInfo);
user.use('/paperInfo', paperInfo);
user.use('/homeworkInfo', homeworkInfo);
user.use('/knowledgeManagement', knowledgeManagement);

user.post('/login', (req, resp) => {
    console.log(req.body);
    const cql = "match (n:Teacher {TeacherUserName: $username}) return n";
    const session = driver.session();
    session.run(cql, {
        username: req.body.username
    })
        .then(res => {
            results = [];
            res.records.forEach((r) => {
                results.push(r._fields[0].properties);
            });
            //查询结果为空
            if (results.length == 0) {
                resp.send({
                    resStatus: 1
                });
            } else {
                //查询结果不为空
                //验证密码是否正确
                if (results[0].TeacherPassWord != req.body.password) {
                    resp.send({
                        resStatus: 2
                    });
                } else {
                    const content = {
                        name: req.body.username
                    };
                    const secretOrPrivateKey = req.body.username;
                    let token = jwt.sign(content, secretOrPrivateKey, {
                        expiresIn: 60*60*2
                    });
                    const cql2 = "match (n:Teacher {TeacherUserName: $username}) set n.LoginToken = $token";
                    const session2 = driver.session();
                    session2.run(cql2, {
                        username: req.body.username,
                        token: token
                    })
                        .then(() => {
                            resp.send({
                                resStatus: 0,
                                token: token,
                                user: req.body.username
                            });
                        });
                }

            }

        });
});

user.get('/verify',async (req,resp)=>{
    const cql = "match (n:Teacher {TeacherUserName: $username, LoginToken: $token}) return n.LoginToken";
    const session = driver.session();
    const res = await session.run(cql,{
        username: req.headers.user,
        token: req.headers.authorization
    })
    tokenIndb = res.records[0]._fields[0];
    jwt.verify(tokenIndb, req.headers.user, (err, decode) => {
        if (err){
            resp.send({
                verifyStatus: 1
            });
        } else {
        resp.send({
            verifyStatus: 0
        });
        }
    });

});

user.get('/checkUserExist', (req, resp) => {
    const cql = "match (n:Teacher {TeacherUserName: $username}) return n";
    const session = driver.session();
    session.run(cql, {
        username: req.query.username
    })
        .then(res => {
            results = [];
            res.records.forEach((r) => {
                results.push(r._fields[0].properties);
            });
            //查询结果为空
            if (results.length == 0) {
                resp.send({
                    resStatus: 0
                });
            } else {
                resp.send({
                    resStatus: 1
                });
            }
        
        });
    });

user.post('/register', async (req, resp) => {
    const date = new Date();
    const session = driver.session();
    const getallusercql = "match (:Teacher) return count(*) as cnt";
    const result = await session.run(getallusercql);
    let usersNum = parseInt(result.records[0].get('cnt')) + 1;
    const cql = "create (n:Teacher { TeacherUserName: $username, TeacherPassWord: $userpassword, TeacherSex: $sex, TeacherRegisterTime: $regtime, TeacherIcon: $icon, TeacherId: $id, TeacherName: $name})";
    const resinfo = {
        resStatus: 0,
        err: ''
    };
    await session.run(cql,{
        username: req.body.username,
        userpassword: req.body.password,
        sex: '',
        regtime: date.toLocaleDateString(),
        icon: '',
        id: usersNum,
        name: ''
    })
    .then(() => {
        resinfo.resStatus = 0;
    })
    .catch(err => {
        if (err) {
            resinfo.resStatus = 1;
            resinfo.err = err;
        }
    });

    resp.send(resinfo);
});

user.get('/menu', (req, resp) => {
    menuInfo = {
        data: [
            {
                id: 1,
                itemName: "数学资源管理",
                children: [
                    {
                        id: 5,
                        itemName: "试题管理",
                        path: "/questionInfo"
                    },
                    {
                        id: 6,
                        itemName: "试卷管理",
                        path: "/paperInfo"
                    },
                    {
                        id: 7,
                        itemName: "作业管理",
                        path: "/homeworkInfo"
                    }
                ]
            }, {
                id: 2,
                itemName: "评分标准体系管理",
                children: [
                    {
                        id: 8,
                        itemName: "模板管理",
                        path: "/templateManagement"
                    }
                ]
            }, {
                id: 3,
                itemName: "知识点标签管理",
                children: [
                    {
                        id: 9,
                        itemName: "知识点管理",
                        path: "/knowledgeInfo"
                    }
                ]
            }, {
                id: 4,
                itemName: "统计管理",
                children: [
                    {
                        id: 10,
                        itemName: "资源统计",
                        path: "/statistic"
                    }
                ]
            }
        ],
        meta: {
            msg: "获取数据失败",
            status: 200
        } 
    }
    resp.send(menuInfo);
});

module.exports = user;