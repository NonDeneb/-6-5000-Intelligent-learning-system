import pandas as pd
from py2neo import Graph, Node, Relationship,NodeMatcher
import datetime, time
import os, shutil, sys

file = sys.argv[1]
user = sys.argv[2]
tempDir = sys.argv[3]
questionImgDir = sys.argv[4]
answerImgDir = sys.argv[5]


graph = Graph("neo4j://121.37.215.152:7687", auth=('neo4j','jiebin123'))
matcher = NodeMatcher(graph)
date = datetime.datetime.now().strftime('%Y-%m-%d')

questions = pd.read_excel(file, sheet_name='题目基本信息').fillna('').to_dict(orient='record')
answers = pd.read_excel(file, sheet_name='答案基本信息').fillna('').to_dict(orient='record')

questionColumnsDict = {
    '题目文本': 'QuestionText',
    '题目难度': 'QuestionDifficulty',
    '建议完成时间': 'Time',
    '题目类型': 'QuestionType',
    '题目说明': 'QuestionSupplement',
    '答案选项': 'QuestionOptions',
    '简要答案': 'SimpleAnswer',
    '题目图片': 'QuestionImage',
    '图片宽度': 'QuestionImageWidth',
    '图片高度': 'QuestionImageHeight',
    '题目分值': 'QuestionScore'
}

answerColumnsDict = {
    '答案文本': 'AnswerText',
    '答案分值': 'AnswerScore',
    '答案图片': 'AnswerImages',
    '图片宽度': 'AnswerImagesWidth',
    '图片高度': 'AnswerImagesHeight',
    '答案说明': 'Description'
}

for q in questions:
    qnode = Node('Question')
    graph.create(qnode)
    teacher = matcher.match("Teacher", TeacherUserName=user).first()
    upload = Relationship(teacher, 'UPLOAD', qnode)
    graph.create(upload)
    for key, value in q.items():
        if key not in questionColumnsDict.keys():
            continue
        elif key == '题目图片':
            if q[key]:
                files = q[key].split('||')
                newfiles = []
                for f in files:
                    filename = user + '-' + str(int(time.time())) + '-' + f
                    newfiles.append(filename)
                    shutil.copy(os.path.join(tempDir, 'questionImgs',f), os.path.join(questionImgDir,filename))
                qnode[questionColumnsDict[key]] = '||'.join(newfiles)
            else:
                qnode[questionColumnsDict[key]] = ''
        else:
            qnode[questionColumnsDict[key]] = value
    qnode['QuestionCollectionTime'] = date
    graph.push(qnode)
    answerSet = [item for item in answers if item['对应题目编号'] == q['题目编号']]
    knowledgeSet = q['知识点'].split('||')
    knowledgeLevelSet = [l.split(',') for l in q['知识点掌握程度'].split('||')]
    skillSet = q['技能'].split('||')
    skillLevelSet = [l.split(',') for l in q['技能水平'].split('||')]
    thoughtsSet = q['思想方法'].split('||')
    for i in range(len(knowledgeSet)):
        knode = matcher.match("Knowledge", KnowledgeName=knowledgeSet[i]).first()
        contain = Relationship(qnode, 'CONTAIN', knode)
        contain['Level'] = knowledgeLevelSet[i]
        graph.create(contain)

    for i in range(len(skillSet)):
        snode = matcher.match("Skill", SkillName=skillSet[i]).first()
        develop = Relationship(qnode, 'DEVELOP', snode)
        develop['Level'] = skillLevelSet[i]
        graph.create(develop)

    for i in range(len(thoughtsSet)):
        tnode = matcher.match("MathThought", ThoughtName=thoughtsSet[i]).first()
        if tnode:
            reflect = Relationship(qnode, 'REFLECT', tnode)
            graph.create(reflect)
        else:
            tnode = Node("MathThought")
            tnode['ThoughtName'] = thoughtsSet[i]
            reflect = Relationship(qnode, 'REFLECT', tnode)
            graph.create(reflect)

    for a in answerSet:
        answerKnowledgeSet = a['知识点'].split('||')
        answerKnowledgeLevelSet = [l.split(',') for l in a['知识点掌握程度'].split('||')]
        anode = Node('Answer')
        graph.create(anode)
        for k, v in a.items():
            if k not in answerColumnsDict.keys():
                continue
            elif k == '答案图片':
                if a[k]:
                    files = a[k].split('||')
                    newfiles = []
                    for f in files:
                        filename = user + '-' + str(int(time.time())) + '-' + f
                        newfiles.append(filename)
                        shutil.copy(os.path.join(tempDir, 'answerImgs',f), os.path.join(answerImgDir,filename))
                    anode[answerColumnsDict[k]] = '||'.join(newfiles)
                else:
                    anode[answerColumnsDict[k]] = ''
            else:
                anode[answerColumnsDict[k]] = v
        graph.push(anode)
        for i in range(len(answerKnowledgeSet)):
            if answerKnowledgeSet[i]:
                aknode = matcher.match("Knowledge", KnowledgeName=answerKnowledgeSet[i]).first()
                contain = Relationship(anode, 'CONTAIN', aknode)
                contain['Level'] = answerKnowledgeLevelSet[i]
                graph.create(contain)

        correspond = Relationship(qnode, 'CORRESPOND', anode)
        correspond['AnswerOrder'] = a['答案次序']
        graph.create(correspond)
print(len(questions))