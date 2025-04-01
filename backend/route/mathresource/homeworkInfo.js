const express = require('express');
const neo4j = require('neo4j-driver');
const bodyparser = require('body-parser');
const path = require('path');
const fs = require('fs');
const homeworkInfo = express.Router();

const neo4jurl = 'bolt://121.37.215.152:7687';
const neo4juser = 'neo4j';
const neo4jpsw = 'jiebin123';
const driver = neo4j.driver(neo4jurl, neo4j.auth.basic(neo4juser, neo4jpsw));

homeworkInfo.use(bodyparser.urlencoded({extended:true}));
homeworkInfo.use(bodyparser.json());

homeworkInfo.get('/getHomeworkAbstract', async (req, resp) => {
  const session = driver.session();
  const getHomeworkAbstract = "match (t:Teacher {TeacherUserName: $username})-[r:RELEASE]->(p:Paper) with toIntegerList(apoc.text.split(r.ReleaseClassId, ',')) as classlist,p,r,r.ReleaseId as rid unwind classlist as class match (s:Student)-[c:COMPLETE]->(p) where c.ClassId = class with size(collect(s.StudentName)) as completedNum, class, p, r, avg(c.totalScore) as avgScore, rid match (cl:Class)-[:GATHER]->(s2:Student) where id(cl)=class return id(p) as id, r.ReleaseDate as date, p.PaperName as paper, p.PaperType as type, apoc.node.degree.out(p, 'CONSISTOF') as qamt, cl.ClassName as classname, completedNum as completed, size(collect(s2.StudentName)) as total, round(avgScore,2) as avgscore, rid, class as classid";
  const homeworkAbstract = await session.run(getHomeworkAbstract, { username: req.query.user });
  const homeworks = [];
  const homeworksId = [];
  let curIndex = -1;
  homeworkAbstract.records.forEach(item => {
    if (homeworksId.indexOf(parseInt(item.get('id'))) == -1) {
      homeworks.push({
        id: parseInt(item.get('id')),
        type: item.get('type'),
        paperName: item.get('date') + item.get('paper'),
        date: item.get('date'),
        questionsAmount: parseInt(item.get('qamt')),
        classData: [{
          classId: parseInt(item.get('classid')),
          className: item.get('classname'),
          completed: parseInt(item.get('completed')),
          total: parseInt(item.get('total')),
          avgScore: parseFloat(item.get('avgscore')),
          rid: parseInt(item.get('rid'))
        }]
      })
      curIndex++;
      homeworksId.push(parseInt(item.get('id')))
    } else {
      homeworks[curIndex].classData.push({
        classId: parseInt(item.get('classid')),
        className: item.get('classname'),
        completed: parseInt(item.get('completed')),
        total: parseInt(item.get('total')),
        avgScore: parseFloat(item.get('avgscore')),
        rid: parseInt(item.get('rid'))
      })
    }
  })
  resp.send({
    data: homeworks
  })
})

homeworkInfo.get('/requireStudentData', async (req, resp) => {
  console.log(req.query);
  const session = driver.session();
  const requireQuestionData = 'call { match (t:Teacher {TeacherUserName: $username})-[:RELEASE {ReleaseId: $releaseid}]->(p:Paper) with p match (p)-[c:CONSISTOF]->(q:Question) return id(q) as id order by c.QuestionOrder } unwind id as qid match (q:Question)-[c:CORRESPOND]->(a:Answer) where id(q) = qid with qid, q.QuestionText as questionText, q.QuestionType as questionType, q.QuestionImage as questionImage, q.QuestionImageHeight as height, q.QuestionImageWidth as width, a.AnswerText as txt, a.AnswerScore as answerscore order by c.AnswerOrder return qid, questionText, questionType, questionImage, height, width, collect(txt) as scorePoint, collect(answerscore) as score';
  const requireStudentData = 'match (c:Class)-[:GATHER]-(s:Student)-[com:COMPLETE]->(:Paper) where id(c) = $classid and com.ReleaseId = $releaseid return id(s) as id, s.StudentName as name, com.submitData as submission';
  const questionDataRes = await session.run(requireQuestionData, { username: req.query.username, releaseid: parseInt(req.query.releaseid) });
  const studentDataRes = await session.run(requireStudentData, { classid: parseInt(req.query.classid), releaseid: parseInt(req.query.releaseid) });
  const questionData = questionDataRes.records.map(item => {
    return {
      qid: parseInt(item.get('qid')),
      questionText: item.get('questionText'),
      questionType: item.get('questionType'),
      questionImage: item.get('questionImage'),
      height: item.get('height'),
      width: item.get('width'),
      scorePoint: item.get('scorePoint').map((it, idx) => {
        return {
          index: idx,
          answerText: it,
          answerScore: parseInt(item.get('score')[idx])
        }
      })
    }
  });
  const studentData = studentDataRes.records.map(item => {
    return {
      id: parseInt(item.get('id')),
      studentname: item.get('name'),
      submission: item.get('submission')
    }
  });

  resp.send({
    questionData: questionData,
    studentData: studentData
  });

})

homeworkInfo.get('/requirePageData', async (req, resp) => {
  const session = driver.session();
  const requireAllPaper = 'match (p:Paper) return id(p) as id, p.PaperType as type, p.PaperName as name, p.PaperFile as filename';
  const requireClasses = 'match (:Teacher {TeacherUserName: $username})-[:MANAGE]->(c:Class) return id(c) as id, c.ClassName as name'
  const allPaper = await session.run(requireAllPaper);
  const classes = await session.run(requireClasses, {username: req.query.user});
  const paperData = [];
  const typeArr = [];
  let curIndex = -1;
  allPaper.records.forEach(item => {
    if (typeArr.indexOf(item.get('type')) == -1) {
      paperData.push({
        itemName: item.get('type'),
        children: [{
          pid: parseInt(item.get('id')),
          itemName: item.get('name'),
          filename: item.get('filename')
        }]
      })
      curIndex++;
      typeArr.push(item.get('type'))
    } else {
      paperData[curIndex].children.push({
        pid: parseInt(item.get('id')),
        itemName: item.get('name'),
        filename: item.get('filename')
      })
    }
  });
  const parentLen = paperData.length
  let idx = 1;
  for(let i = 0; i < parentLen; i++) {
    paperData[i].id = idx;
    idx++;
  }
  for(let i = 0; i < parentLen; i++) {
    const childLen = paperData[i].children.length;
    for (let j = 0; j < childLen; j++) {
      paperData[i].children[j].id = idx;
      idx++;
    }
  }
  resp.send({
    paperData: paperData,
    classes: classes.records.map(item => {
      return {
        value: parseInt(item.get('id')),
        label: item.get('name')
      }
    })
  })

})

homeworkInfo.get('/submitAllData', (req, resp) => {
  const submission = [];
  console.log(req.query);
  req.query.correction.forEach((item1, idx1) => {
    let studentData = {};
    studentData.studentId = req.query.studentData[idx1];
    studentData.submissionData = [];
		eval(item1).forEach((item2, idx2) => {
			studentData.submissionData.push({
        questionId: req.query.questionData[idx2],
				pointScore: item2,
				totalScore: item2.reduce((total, cur) => total + cur)
      })
    })
    submission.push(studentData)
  })
  console.log(submission.map(item => {
    return item.submissionData
  }));
  resp.send({
    status: 'ok'
  })
})

module.exports = homeworkInfo;