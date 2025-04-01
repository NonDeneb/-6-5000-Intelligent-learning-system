import pandas as pd
from py2neo import Graph, Node, Relationship,NodeMatcher
import json

graph = Graph("neo4j://121.37.215.152:7687", auth=('neo4j','jiebin123'))

res = graph.run('''match (n:Knowledge) where apoc.node.degree.in(n, "INCLUDE") = 0
optional match (n)-[:INCLUDE]->(m)
optional match (m)-[:INCLUDE]->(o)
optional match (o)-[:INCLUDE]->(p)
optional match (p)-[:INCLUDE]->(q)
return n.KnowledgeName as first, m.KnowledgeName as second, o.KnowledgeName as third, p.KnowledgeName as fourth, q.KnowledgeName as fifth
''')

resDf = res.to_data_frame()

Trees = []
firstGroup = list(resDf.groupby('first'))
for f in firstGroup:
    firstDict = {}
    firstDict['label'] = f[0]
    secondGroup = list(f[1].groupby('second'))
    secondChildren = []
    for s in secondGroup:
        if s[0] == None:
            continue
        secondDict = {}
        secondDict['label'] = s[0]
        thirdGroup = list(s[1].groupby('third'))
        thirdChildren = []
        for t in thirdGroup:
            if t[0] == None:
                continue
            thirdDict = {}
            thirdDict['label'] = t[0]
            fourthGroup = list(t[1].groupby('fourth'))
            fourthChildren = []
            for fo in fourthGroup:
                if fo[0] == None:
                    continue
                fourthDict = {}
                fourthDict['label'] = fo[0]
                fifthGroup = list(fo[1].groupby('fifth'))
                fifChildren = []
                for fi in fifthGroup:
                    if fi[0] == None:
                        continue
                    fifthDict = {}
                    fifthDict['label'] = fi[0]
                    fifChildren.append(fifthDict)
                if len(fifChildren) != 0:
                    fourthDict['children'] = fifChildren
                fourthChildren.append(fourthDict)
            if len(fourthChildren) != 0:
                thirdDict['children'] = fourthChildren
            thirdChildren.append(thirdDict)
        if len(thirdChildren) != 0:
            secondDict['children'] = thirdChildren
        secondChildren.append(secondDict)
    if len(secondChildren) != 0:
        firstDict['children'] = secondChildren
    Trees.append(json.dumps(firstDict, ensure_ascii=False))

with open('/home/jiebinhuang/myproject/backend/public/knowledgesList.txt', 'w') as f:
  f.writelines('$$$'.join(Trees))