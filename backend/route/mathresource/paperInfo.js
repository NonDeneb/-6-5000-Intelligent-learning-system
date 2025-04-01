const express = require('express');
const neo4j = require('neo4j-driver');
const bodyparser = require('body-parser');
const path = require('path');
const fs = require('fs');
const paperInfo = express.Router();
const exec = require('child_process').exec;

const neo4jurl = 'bolt://121.37.215.152:7687';
const neo4juser = 'neo4j';
const neo4jpsw = 'jiebin123';
const driver = neo4j.driver(neo4jurl, neo4j.auth.basic(neo4juser, neo4jpsw));

paperInfo.use(bodyparser.urlencoded({extended:true}));
paperInfo.use(bodyparser.json());

paperInfo.get('/getPaperAbstract', async (req, resp) => {
  console.log(req.query);
  const session = driver.session();
  if (req.query.query == '全部') {
    const getPaperAbstract = 'match (t:Teacher)-[:ASSEMBLE]->(p:Paper) return t.TeacherUserName as teacheruser, t.TeacherName as teacher, p.PaperName as name, p.PaperFile as filename, p.PaperType as type, id(p) as id, p.PaperAssembledDate as date skip ' + parseInt((parseInt(req.query.pagenum) - 1) * parseInt(req.query.pagesize)) + " limit " + parseInt(req.query.pagesize);
    const getPaperNum = 'match (t:Teacher)-[:ASSEMBLE]->(p:Paper) with distinct p.PaperId as id return count(id) as cnt'
    const res = await session.run(getPaperAbstract);
    const numRes = await session.run(getPaperNum);
    const totalNum = numRes.records[0].get('cnt');
    const papers = res.records.map(item => {
      let date = item.get('date').split('-')
      return {
        id: parseInt(item.get('id')),
        name: item.get('name'),
        filename: item.get('filename'),
        year: date[0],
        month: date[1],
        day: date[2],
        type: item.get('type'),
        assembler: item.get('teacher'),
        assembleruser: item.get('teacheruser')
      }
    });
    resp.send({
      status: 200,
      total: parseInt(totalNum),
      data: papers
    });
  } else {
    const getPaperAbstract = 'match (t:Teacher)-[:ASSEMBLE]->(p:Paper {PaperType: $type}) return t.TeacherUserName as teacheruser, t.TeacherName as teacher, p.PaperName as name, p.PaperFile as filename, p.PaperType as type, id(p) as id, p.PaperAssembledDate as date skip ' + parseInt((parseInt(req.query.pagenum) - 1) * parseInt(req.query.pagesize)) + " limit " + parseInt(req.query.pagesize);
    const getPaperNum = 'match (t:Teacher)-[:ASSEMBLE]->(p:Paper {PaperType: $type}) with distinct p.PaperId as id return count(id) as cnt'
    const res = await session.run(getPaperAbstract, {type: req.query.query});
    const numRes = await session.run(getPaperNum, {type: req.query.query});
    const totalNum = numRes.records[0].get('cnt');
    const papers = res.records.map(item => {
      let date = item.get('date').split('-')
      return {
        id: parseInt(item.get('id')),
        name: item.get('name'),
        filename: item.get('filename'),
        year: date[0],
        month: date[1],
        day: date[2],
        type: item.get('type'),
        assembler: item.get('teacher'),
        assembleruser: item.get('teacheruser')
      }
    });
    resp.send({
      status: 200,
      total: totalNum,
      data: papers
    });
  }
})

paperInfo.get('/searchForPaper', async (req, resp) => {
  const keyword = '.*' + req.query.keyword + '.*'
  console.log(keyword);
  const searchForPaper = "match (p:Paper) where p.PaperName =~ $keyword return p.PaperId as id, p.PaperName as name, p.PaperFile as filename limit 10"
  const session = driver.session();
  const questions = await session.run(searchForPaper, { keyword: keyword });
  const res = questions.records.map(item => {
    return {
      id: parseInt(item.get('id')),
      value: item.get('name'),
      filename: item.get('filename')
    }
  })
  resp.send(res)
})

paperInfo.get('/requirePageData', async (req, resp) => {
  let res = fs.readFileSync(path.join(__dirname, '../../public/knowledgesList.txt'));
  const session = driver.session();
  const skillRes = await session.run('match (s:Skill) return s.SkillName as name');
  const skill = skillRes.records.map(item => {
    return item.get('name');
  });
  const thoughtsRes = await session.run('match (t:MathThought) return t.ThoughtName as name');
  const thoughts = thoughtsRes.records.map(item => {
    return item.get('name');
  });
  resp.send({
    knowledgesList: res.toString().split('$$$'),
    skill: skill,
    thoughts: thoughts
  });
})

paperInfo.post('/requireQuestionData', async (req, resp) => {
  const session = driver.session();
  const query = JSON.parse(req.body.query);
  console.log(query);
  console.log(query.difficulty);
  // match (q:Question) where q.QuestionType = '解答题' and q.QuestionDifficulty = '偏难'
  // with q
  // match (q)-[:REFLECT]->(t) where t.ThoughtName in ['分类的思想']
  // with q
  // unwind [{name: '推理技能', level: ['分析']}, {name: '图形处理技能', level: ['应用']}] as s
  // match (q)-[r:DEVELOP]->(sk) where sk.SkillName = s.name and r.Level = s.level
  // with q unwind ['勾股定理', '一次函数'] as k match (q)-[:CONTAIN]->(kn) where kn.KnowledgeName = k
  // return q
  let keywordsQuery = '';
  let difAndTpQuery = '';
  let thoughtsQuery = '';
  let skillQuery = '';
  let knowledgesQuery = '';
  let queryParams = {}

  if (query.difficulty && query.type) {
    difAndTpQuery = ` where q.QuestionDifficulty = '${query.difficulty}' and q.QuestionType= '${query.type}' `
  } else if (!query.difficulty && query.type) {
    difAndTpQuery = ` where q.QuestionType= '${query.type}' `
  } else if (query.difficulty && !query.type) {
    difAndTpQuery = ` where q.QuestionDifficulty = '${query.difficulty}' `
  } else {}

  if (query.keywords) {
    keywordsQuery = `with q where q.QuestionText =~ '.*${query.keywords}.*' `
  }

  if (query.thoughts.length) {
    thoughtsQuery = 'with distinct(q) match (q)-[:REFLECT]->(t) where t.ThoughtName in $thoughts ';
    queryParams.thoughts = query.thoughts;
  }

  if (query.skill.length) {
    skillQuery = 'with distinct(q) unwind $skills as s match (q)-[r:DEVELOP]->(sk) where sk.SkillName = s.name and r.Level = s.level ';
    queryParams.skills = query.skill;
  }

  if (query.knowledges.length) {
    knowledgesQuery = 'with distinct(q) unwind $knowledges as k match (q)-[:CONTAIN]->(kn) where kn.KnowledgeName = k ';
    queryParams.knowledges = query.knowledges
  }

  const cql = 'match (q:Question)' + keywordsQuery + difAndTpQuery + thoughtsQuery + skillQuery + knowledgesQuery
              + ' with distinct(q) as q skip ' + parseInt((parseInt(req.body.pagenum) - 1) * parseInt(req.body.pagesize)) + ' limit ' + parseInt(req.body.pagesize) + ' optional match (q)-[:CONSISTOF]-(p) with q, count(p) as cnt return id(q) as id, q.QuestionText as text, q.QuestionImage as images, q.QuestionImageHeight as height, q.QuestionOptions as options, q.QuestionImageWidth as width, q.QuestionScore as score, q.QuestionCollectionTime as time, q.QuestionDifficulty as difficulty, q.QuestionType as type, cnt order by id';
  const getQuestionNum = 'match (q:Question)' + keywordsQuery + difAndTpQuery + thoughtsQuery + skillQuery + knowledgesQuery
                          + ' with distinct(q) as q return count(q) as cnt'
  console.log(cql);
  const res = await session.run(cql, queryParams);
  const numRes = await session.run(getQuestionNum, queryParams)
  resp.send({
    total: parseInt(numRes.records[0].get('cnt')),
    questionData: res.records.map(item => {
      const date = item.get('time').split('-')
      return {
        id: parseInt(item.get('id')),
        text: item.get('text'),
        options: item.get('options'),
        images: item.get('images').split('||'),
        width: item.get('width').split('||'),
        height: item.get('height').split('||'),
        score: parseInt(item.get('score')),
        year: date[0],
        month: date[1],
        day: date[2],
        difficulty: item.get('difficulty'),
        type: item.get('type'),
        counts: parseInt(item.get('cnt'))
      }
    })
  })
})

paperInfo.post('/previewPaper', (req, resp) => {
  const plugin = path.join(__dirname, '../../plugins/topdf.py')
  const submitTimeStr = Date.now().toString()
  console.log('python ' + plugin + ' ' + req.body.title + ' ' + req.body.subTitle + ' ' + submitTimeStr + ' ' + req.body.user + " '" + JSON.stringify(req.body.questionData) + "'" + ' 1');
  exec('python ' + plugin + ' ' + req.body.title + ' ' + req.body.subTitle + ' ' + submitTimeStr + ' ' + req.body.user + " '" + JSON.stringify(req.body.questionData) + "'" + ' 1', { timeout: 10000 }, (err, stdout, stderr) => {
    if (err) {
      resp.send({
        msg: '执行出错',
        flag: 1
      })
      throw err
    } else {
      console.log(stdout);
      console.log(submitTimeStr);
      resp.send({
        msg: '编译成功',
        flag: 0,
        timeparams: submitTimeStr
      })
    }
  });
})

paperInfo.post('/createPaper', (req, resp) => {
  const plugin = path.join(__dirname, '../../plugins/topdf.py')
  const submitTimeStr = Date.now().toString()
  exec('python ' + plugin + ' ' + req.body.title + ' ' + req.body.subTitle + ' ' + submitTimeStr + ' ' + req.body.user + " '" + JSON.stringify(req.body.questionData) + "'" + ' 0', { timeout: 10000 }, async (err, stdout, stderr) => {
    if (err) {
      resp.send({
        msg: '执行出错',
        flag: 1
      })
      throw err
    } else {
      const questions = []
      req.body.questionData.forEach(item => {
        for (let i = 0; i < item.items.length; i++){
          questions.push(item.items[i])
        }
      })
      const session = driver.session();
      const createPaper = 'create (p:Paper {PaperName: $papername, PaperAssembledDate: $date, PaperFile: $filename, PaperType: $type}) return id(p) as id';
      const matchTeacher = 'match (t:Teacher {TeacherUserName: $username}),(p:Paper) where id(p)=$pid merge (t)-[:ASSEMBLE]->(p)'
      const matchQuestion = 'unwind $questions as qs match (p:Paper),(q:Question) where id(p)=$pid and id(q)=qs.id merge (p)-[:CONSISTOF]->(q)';
      const res = await session.run(createPaper, {
        papername: req.body.title,
        date: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join('-'),
        filename: req.body.user + '-' + submitTimeStr + req.body.title + '.pdf',
        type: req.body.type
      })
      await session.run(matchQuestion, {
        questions: questions,
        pid: parseInt(res.records[0].get('id'))
      })
      await session.run(matchTeacher, {
        username: req.body.user,
        pid: parseInt(res.records[0].get('id'))
      })
      resp.send({
        msg: '提交成功',
        flag: 0
      })
    }
  });
})

module.exports = paperInfo;