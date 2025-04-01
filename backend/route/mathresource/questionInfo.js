const express = require('express');
const neo4j = require('neo4j-driver');
const multer = require('multer');
const bodyparser = require('body-parser');
const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;


const neo4jurl = 'bolt://121.37.215.152:7687';
const neo4juser = 'neo4j';
const neo4jpsw = 'jiebin123';
const driver = neo4j.driver(neo4jurl, neo4j.auth.basic(neo4juser, neo4jpsw));

const questionInfo = express.Router();

questionInfo.use(bodyparser.urlencoded({extended:true}));
questionInfo.use(bodyparser.json());

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname,'../../public/tempimgs'))
  },
  filename: function (req, file, cb) {
    cb(null, req.body.username + '-' + Date.now() + '-' + file.originalname)
  }
});

let storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname,'../../public/tempfiles'))
  },
  filename: function (req, file, cb) {
    cb(null, req.body.user + '-' + Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });
const upload2 = multer({ storage: storage2 });


questionInfo.get('/getQuestionAbstract', async (req, resp) => {
  let getQuestionNum = '';
  let getAllKnowledges = '';
  let cql = '';
  if (req.query.query){
    params = JSON.parse(req.query.query);
    let questionStr = params.Question? JSON.stringify(params.Question).replace(/"([^"]+)":/g, '$1:') : '';
    let knowledgeParams = params.Knowledges? params.Knowledges : [];
    console.log(knowledgeParams);
    if (knowledgeParams.length != 0){
      let knowledgesStr = '[';
      for (let i = 0; i < knowledgeParams.length; i++){
        if (i === knowledgeParams.length - 1){
          knowledgesStr += "'" + knowledgeParams[i] + "']";
        } else {
          knowledgesStr += "'" + knowledgeParams[i] + "',";
        }
      }
      getQuestionNum = "unwind " + knowledgesStr + " as kn match (n:Question " + questionStr + ")-[:CONTAIN]->(k:Knowledge {KnowledgeName: kn}) with distinct id(n) as id return count(id) as cnt";
      cql = "unwind " + knowledgesStr + " as kn match (p)-[:UPLOAD]->(q:Question " +  questionStr + ")-[:CONTAIN]->(k:Knowledge {KnowledgeName: kn}) return distinct id(q) as qid, q.QuestionText as question, q.QuestionDifficulty as difficulty, q.QuestionCollectionTime as time, p.TeacherName as uploader, p.TeacherUserName as uploaderUser order by qid skip " + parseInt((parseInt(req.query.pagenum) - 1) * parseInt(req.query.pagesize)) + " limit " + parseInt(req.query.pagesize);
    } else {
      getQuestionNum = "match (n:Question " + questionStr + ")-[:CONTAIN]->(k:Knowledge) with distinct id(n) as id return count(id) as cnt";
      cql = "match (p)-[:UPLOAD]->(q:Question " +  questionStr + ")-[:CONTAIN]->(k:Knowledge) return distinct id(q) as qid, q.QuestionText as question, q.QuestionDifficulty as difficulty, q.QuestionCollectionTime as time, p.TeacherName as uploader, p.TeacherUserName as uploaderUser order by qid skip " + parseInt((parseInt(req.query.pagenum) - 1) * parseInt(req.query.pagesize)) + " limit " + parseInt(req.query.pagesize);
    }
      getAllKnowledges = "match (n:Knowledge) return id(n) as id, n.KnowledgeName as knowledge order by id";
  } else {
    getQuestionNum = "match (q:Question) return count(*) as cnt";
    getAllKnowledges = "match (n:Knowledge) return id(n) as id, n.KnowledgeName as knowledge order by id";
    cql = "match (p)-[:UPLOAD]->(q:Question) return id(q) as qid, q.QuestionText as question, q.QuestionDifficulty as difficulty, q.QuestionCollectionTime as time, p.TeacherName as uploader, p.TeacherUserName as uploaderUser order by qid skip " + parseInt((parseInt(req.query.pagenum) - 1) * parseInt(req.query.pagesize)) + " limit " + parseInt(req.query.pagesize);
  }
  const session = driver.session();
  const numresult = await session.run(getQuestionNum);
  const allKnowledges = await session.run(getAllKnowledges);
  let questionNum = parseInt(numresult.records[0].get('cnt'));
  let knowledges = allKnowledges.records.map(item => {
    return {
      id: parseInt(item.get('id')),
      knowledge: item.get('knowledge')
    }
  });
  session.run(cql)
         .then(res => {
    result = [];
    for(let i = 0; i < res.records.length; i++){
      let time = res.records[i].get('time').split('-')
      result.push({
        id: parseInt(res.records[i].get('qid')),
        question: res.records[i].get('question'),
        difficulty: res.records[i].get('difficulty'),
        year: parseInt(time[0]),
        month: parseInt(time[1]),
        day: parseInt(time[2]),
        uploader: res.records[i].get('uploader'),
        uploaderUser: res.records[i].get('uploaderUser')
      })
    }
    // console.log(result);
    resp.send({
      status: 200,
      pagenum: req.query.pagenum,
      total: questionNum,
      allKnowledges: knowledges,
      results: result
    })
  }).catch( err =>{
    if (err) {
      resp.send({
        status: 404,
        error: err
      })
    }
  })
});

questionInfo.post('/uploadQuestionFiles', upload2.single('file'), (req, resp) => {
  const dirname = req.body.user + '-' + Date.now();
  exec('unzip ' + path.join(__dirname,'../../public/tempfiles/' + req.file.filename) + ' -d ' + path.join(__dirname,'../../public/tempfiles/' + dirname), (err, stdout, stderr) => {
    if (err) {
      throw err;
    }
  });
  const file  = path.join(__dirname,'../../public/tempfiles/', dirname, '/试题/uploadTemplate.xlsx');
  const tempDir = path.join(__dirname,'../../public/tempfiles/', dirname + '/试题/');
  const questionImgDir = path.join(__dirname, '../../public/questionImgs/');
  const answerImgDir = path.join(__dirname, '../../public/answerImgs/');
  const plugin = path.join(__dirname, '../../plugins/parseFile.py')
  exec('python ' + plugin + ' ' + file + ' ' + req.body.user + ' ' + tempDir + ' ' + questionImgDir + ' ' + answerImgDir, (err, stdout, stderr) => {
    if (err) {
      throw err;
    } else {
      console.log(stdout);
      resp.send({
        msg: '上传成功',
        questionNum: stdout
      });
      exec('rm -r ' + path.join(__dirname,'../../public/tempfiles/',req.body.user + '*'), err => {
        if (err) {
          throw err;
        }
      })
    }
  })
});

questionInfo.get('/getQuestionDetail', async (req, resp) => {
  const getUploadUser = "match (t:Teacher)-[:UPLOAD]->(q:Question) where id(q) = $questionId return t.TeacherUserName as username"
  const getQuestionInfo = "match (q:Question) where id(q) = $questionId return q";
  const getAllKnowledges = "match (q:Question)-[c:CONTAIN]->(k:Knowledge) where id(q) = $questionId return distinct id(k) as id, k.KnowledgeName as knowledge, c.Level as level;"
  const getAnswerAndKnowledgeInfo = "match (q:Question)-[c:CORRESPOND]-(a:Answer) where id(q) = $questionId optional match (a)-[ct:CONTAIN]-(k:Knowledge) return id(a) as id, c.AnswerOrder as cid, a.AnswerText as text, a.AnswerScore as score, a.AnswerImages as images, a.AnswerImagesHeight as height, a.AnswerImagesWidth as width, a.Description as description, collect(k.KnowledgeName) as knowledge, collect(ct.Level) as level order by cid";
  const getThoughtsInfo = "match (q:Question)-[:REFLECT]->(t:MathThought) where id(q) = $questionId return id(t) as id, t.ThoughtName as thoughts";
  const getSkillInfo = "match (q:Question)-[d:DEVELOP]->(s:Skill) where id(q) = $questionId return id(s) as id, s.SkillName as skills, d.Level as level";
  
  const session = driver.session();
  const uploader = await session.run(getUploadUser, { questionId: parseInt(req.query.questionId) });
  const questionInfoRes = await session.run(getQuestionInfo,{ questionId: parseInt(req.query.questionId) });
  const knowledgeInfoRes = await session.run(getAllKnowledges,{ questionId: parseInt(req.query.questionId) });
  const answerInfoRes = await session.run(getAnswerAndKnowledgeInfo,{ questionId: parseInt(req.query.questionId) });
  const thoughtsInfoRes = await session.run(getThoughtsInfo,{ questionId: parseInt(req.query.questionId) });
  const skillInfoRes = await session.run(getSkillInfo,{ questionId: parseInt(req.query.questionId) });
  
  const questionDetail = questionInfoRes.records[0].get('q').properties;
  questionDetail.uploader = uploader.records[0].get('username');
  questionDetail.QuestionId = req.query.questionId;
  questionDetail.QuestionScore = parseFloat(questionDetail.QuestionScore);
  questionDetail.QuestionCollectionTime = (new Date(questionDetail.QuestionCollectionTime)).toLocaleDateString();
  questionDetail.Time = parseFloat(questionDetail.Time);
  questionDetail.totalKnowledge = knowledgeInfoRes.records.map(item => {
    return {
      knowledgeName: item.get('knowledge'),
      level: item.get('level').join(',')
    }
  });
  
  questionDetail.answers = answerInfoRes.records.map(item=>{
    const answerResImages = []
    const images = item.get('images').split('||');
    const width = item.get('width').split('||');
    const height = item.get('height').split('||');
    for (let i = 0; i < images.length; i++) {
      answerResImages.push({
        url: 'http://121.37.215.152:8889/answerImgs/' + images[i],
        filename: images[i],
        width: width[i],
        height: height[i]
      })
    }
    return {
      id: parseInt(item.get('id')),
      text: item.get('text'),
      images: answerResImages,
      score: parseInt(item.get('score')),
      knowledge: item.get('knowledge'),
      level: item.get('level'),
      description: item.get('description')
    }
  });
  questionDetail.thoughts = thoughtsInfoRes.records.map(item=>{
    return {
      id: parseInt(item.get('id')),
      thoughts: item.get('thoughts')
    }
  });
  questionDetail.skills = skillInfoRes.records.map(item=>{
    return {
      id: parseInt(item.get('id')),
      skill: item.get('skills'),
      level: item.get('level').join(',')
    }
  });
  questionDetail.status = 200
  resp.send(questionDetail);
});

questionInfo.post('/uploadQuestionImage', upload.single('file'), (req, resp) => {
  resp.send({
    msg: '上传成功',
    filename: req.file.filename
  });
})

questionInfo.get('/deleteTempimgs', (req, resp) => {
  fList = req.query.files.split(',');
  try {
    for (let i = 0; i < fList.length; i++){
      fs.unlink(path.resolve(__dirname,'../../public/tempimgs/' + fList[i]), err => {
        if (err) {
          throw err;
        }
      })
    }
  } catch (error) {
    resp.send({
      msg: error
    })
  }
  resp.send({
    msg: '删除成功'
  })
})

questionInfo.get('/searchForQuestion', async (req, resp) => {
  const keyword = '.*' + req.query.keyword + '.*'
  console.log(keyword);
  const searchForQuestion = "match (q:Question) where q.QuestionText =~ $keyword return id(q) as id, q.QuestionText as name limit 10"
  const session = driver.session();
  const questions = await session.run(searchForQuestion, { keyword: keyword });
  const res = questions.records.map(item => {
    return {
      id: parseInt(item.get('id')),
      value: item.get('name')
    }
  })
  resp.send(res)
})

questionInfo.get('/searchKnowledge', async (req, resp) => {
  const keywords = req.query.keywords.map(item => {
    return '.*' + item + '.*'
  })
  console.log(keywords);
  const searchKnowledge = "unwind $keywords as key match (k:Knowledge) where k.KnowledgeName =~ key return k.KnowledgeName as name limit 5"
  const session = driver.session();
  const knowledges = await session.run(searchKnowledge, { keywords: keywords});
  const res = knowledges.records.map(item => {
    return {
      knowledgeName: item.get('name')
    }
  })
  resp.send(res)
})

questionInfo.get('/requireAllSkill', async (req, resp) => {
  const requireAllSkill = 'match (s:Skill) return s.SkillName as name';
  const session = driver.session();
  const skill = await session.run(requireAllSkill)
  const res = skill.records.map(item => {
    return {
      skillName: item.get('name')
    }
  });
  resp.send(res);
})

questionInfo.get('/requireAllThoughts', async (req, resp) => {
  const requireAllThoughts = 'match (t:MathThought) return t.ThoughtName as name, id(t) as id order by id';
  const session = driver.session();
  const thoughts = await session.run(requireAllThoughts)
  const res = thoughts.records.map((item,idx) => {
    return {
      id: idx + 1,
      thoughtName: item.get('name')
    }
  });
  resp.send(res);
})

questionInfo.get('/updateQuestion', async (req, resp) => {
  const questionInput = JSON.parse(req.query.questionInput);
  const pointSetting = JSON.parse(req.query.pointSetting);
  const totalSetting = JSON.parse(req.query.totalSetting);

  const session = driver.session();
  const typeArr = ['选择题', '填空题', '判断题', '解答题']

  // 题目处理
  const updateQuestion = 'merge (q:Question {QuestionCollectionTime: $date, QuestionSupplement: $description, QuestionImage: $images, QuestionImageWidth: $imagesWidth, QuestionImageHeight: $imagesHeight, QuestionText: $text, QuestionType: $type, QuestionDifficulty: $difficulty, Time: $time, QuestionScore: $score, SimpleAnswer: $answer}) return id(q) as id';
  const setUploader = 'match (t:Teacher {TeacherUserName: $username}),(q:Question) where id(q) = $qid merge (t)-[:UPLOAD]->(q)';
  const questionType = typeArr[parseInt(questionInput.type) - 1]

  let questionImagesArr = '';
  let questionImagesWidth = ''
  let questionImagesHeight = ''
  if (questionInput.question.image.length){
    let ImagesArr = []
    const questionImgsNum = fs.readdirSync(path.resolve(__dirname,'../../public/questionImgs')).length;
    const questionImages = questionInput.question.image.map(item => {
      const splitarr = item.url.split('/')
      return splitarr[splitarr.length - 1]
    });
    questionImagesWidth = questionInput.question.image.map(item => {
      return item.width
    }).join('||');
    questionImagesHeight = questionInput.question.image.map(item => {
      return item.height
    }).join('||');
    for (let i = 0; i < questionImages.length; i++) {
      const fileName = questionImgsNum + 1 + '.jpg';
      const destPath = path.resolve(__dirname, '../../public/questionImgs', fileName);
      const sourcePath = path.resolve(__dirname,'../../public/tempimgs', questionImages[i]);
      ImagesArr.push(fileName);
      const source = fs.createReadStream(sourcePath);
      const dest = fs.createWriteStream(destPath);
      source.pipe(dest);
    }
    questionImagesArr = ImagesArr.join('||')
  }
  let totalScore = 0;
  pointSetting.answer.forEach(item => {
    totalScore += parseInt(item.score)
  });
  const questionParams = {
    date: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join('-'),
    description: questionInput.description.text,
    images: questionImagesArr,
    imagesWidth: questionImagesWidth,
    imagesHeight: questionImagesHeight,
    text: questionInput.question.text,
    type: questionType,
    difficulty: totalSetting.difficulty,
    time: questionInput.time,
    score: totalScore,
    answer: questionInput.answer.text
  }

  const udtqRes = await session.run(updateQuestion, questionParams);
  const qid = parseInt(udtqRes.records[0].get('id'))
  await session.run(setUploader, { username: req.query.user, qid: qid });

  // 答案处理

  const updateAnswer = 'unwind $answers as answer match (q:Question) where id(q) = $qid merge (q)-[:CORRESPOND {AnswerOrder: answer.id}]->(a:Answer {AnswerText: answer.text, AnswerScore: answer.score, AnswerImages: answer.filesname, AnswerImagesWidth: answer.width, AnswerImagesHeight: answer.height, Description: answer.descriptionText}) return id(a) as id'


  const answerImgsNum = fs.readdirSync(path.resolve(__dirname,'../../public/answerImgs')).length;
  const answerImages = pointSetting.answer.map(item => {
    let filesname = []
    if (item.partInfo.image.length){
      filesname = item.partInfo.image.map(img => {
        const splitarr = img.url.split('/')
        return splitarr[splitarr.length - 1]
      })
    }
    return {
      id: item.id,
      filesname: filesname
    }
  });
  const answerImagesWidth = pointSetting.answer.map(item => {
    return {
      id: item.id,
      width: item.partInfo.image.map(img => {
        return img.width
      })
    }
  });
  const answerImagesHeight = pointSetting.answer.map(item => {
    return {
      id: item.id,
      height: item.partInfo.image.map(img => {
        return img.height
      })
    }
  });

  const answerArr = [];
  for (let i = 0; i < answerImages.length; i++) {
    answerArr.push({
      id: answerImages[i].id,
      text: pointSetting.answer[i].partInfo.text,
      score: pointSetting.answer[i].score,
      knowledges: pointSetting.answer[i].knowledge,
      filesname: '',
      width: answerImagesWidth[i].width.join('||'),
      height: answerImagesHeight[i].height.join('||'),
      descriptionText: pointSetting.answer[i].descriptionText
    });
    let filesname = []
    for (let j = 0; j < answerImages[i].filesname.length; j++){
      const fileName = answerImgsNum + 1 + '.jpg';
      const destPath = path.resolve(__dirname, '../../public/answerImgs', fileName);
      const sourcePath = path.resolve(__dirname,'../../public/tempimgs', answerImages[i].filesname[j]);
      filesname.push(fileName)
      answerArr[i].filesname = filesname.join('||')
      const source = fs.createReadStream(sourcePath);
      const dest = fs.createWriteStream(destPath);
      source.pipe(dest);
    }
  }

  const answeridRes = await session.run(updateAnswer, { answers: answerArr, qid: qid});
  const aidres = answeridRes.records.map(item => {
    return parseInt(item.get('id'))
  })

  for (let i = 0; i < answerArr.length; i++) {
    answerArr[i].aid = aidres[i]
  }

  const updateAnsKnowledge = 'unwind $answers as answer unwind answer.knowledges as knowledge match (a:Answer), (k:Knowledge {KnowledgeName: knowledge.knowledgeName}) where id(a) = answer.aid merge (a)-[:CONTAIN {Level: knowledge.level}]->(k)'
  const updateKnowledge = 'unwind $knowledges as k match (q:Question), (knowledge:Knowledge {KnowledgeName: k.knowledgeName}) where id(q) = $qid merge (q)-[:CONTAIN {Level: k.level}]->(knowledge)'
  const updateSkill = 'unwind $skills as s match (q:Question), (skill:Skill {SkillName: s.skillName}) where id(q) = $qid merge (q)-[:DEVELOP {Level: s.level}]->(skill)'
  const requireAllThoughts = 'match (t:MathThought) return t.ThoughtName as thought'
  
  let updateThoughts = ''

  const thoughtres = await session.run(requireAllThoughts);
  const thoughtsData = thoughtres.records.map(item => {
    return item.get('thought')
  })

  
  await session.run(updateAnsKnowledge, { answers: answerArr });
  await session.run(updateKnowledge, { knowledges: totalSetting.knowledges, qid: qid });
  await session.run(updateSkill, { skills: totalSetting.skills, qid: qid });
  for (let i = 0; i < totalSetting.thoughts.length; i++) {
    if (thoughtsData.indexOf(totalSetting.thoughts[i]) != -1) {
      updateThoughts = 'match (q:Question),(t:MathThought {ThoughtName: $thought}) where id(q) = $qid merge (q)-[:REFLECT]->(t)'
      await session.run(updateThoughts, { thought: totalSetting.thoughts[i], qid: qid});
    } else {
      updateThoughts = 'match (q:Question) where id(q) = $qid merge (q)-[:REFLECT]->(t:MathThought {ThoughtName: $thought})'
      await session.run(updateThoughts, { thought: totalSetting.thoughts[i], qid: qid});
    }
  }

  resp.send({
    status: 200
  });
})

module.exports = questionInfo;