const express = require('express');
const neo4j = require('neo4j-driver');
const bodyparser = require('body-parser');
const path = require('path');
const fs = require('fs');
const knowledgeManagement = express.Router();

const neo4jurl = 'bolt://121.37.215.152:7687';
const neo4juser = 'neo4j';
const neo4jpsw = 'jiebin123';
const driver = neo4j.driver(neo4jurl, neo4j.auth.basic(neo4juser, neo4jpsw));

knowledgeManagement.use(bodyparser.urlencoded({extended:true}));
knowledgeManagement.use(bodyparser.json());

knowledgeManagement.get('/requirePageData', async (req, resp) => {
  const requireAllKnowledges = 'match (k:Knowledge) return count(*) as cnt';
  const requireKnowledges = 'match (k:Knowledge) return toInteger(k.KnowledgeId) as id, k.KnowledgeName as name order by id skip ' + parseInt((parseInt(req.query.pagenum) - 1) * parseInt(req.query.pagesize)) + ' limit ' + parseInt(req.query.pagesize);
  const session = driver.session();
  const res = await session.run(requireKnowledges);
  const total = (await session.run(requireAllKnowledges)).records[0].get('cnt');
  const knowledge = res.records.map(item => {
    return {
      id: parseInt(item.get('id')),
      name: item.get('name')
    }
  });
  resp.send({
    total: parseInt(total),
    knowledge: knowledge
  });
});

knowledgeManagement.get('/requireKnowledgeDetail', async (req, resp) => {
  const requireKnowledgeDetail = 'match p=(k1:Knowledge {KnowledgeId: "1"})-[*]->(k2:Knowledge) return p';
  const session = driver.session();
  const res = await session.run(requireKnowledgeDetail);
  const segments = res.records.map(item => {
    return item.get('p').segments
  });
  const nodesId = [];
  const nodes = [];
  const relationshipsId = [];
  const relationships = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = 0; j < segments[i].length; j++) {
      if (nodesId.indexOf(parseInt(segments[i][j].start.identity)) == -1) {
        nodesId.push(parseInt(segments[i][j].start.identity));
        nodes.push({
          id: parseInt(segments[i][j].start.identity),
          name: segments[i][j].start.properties.KnowledgeName
        });
      }
      if (nodesId.indexOf(parseInt(segments[i][j].end.identity)) == -1) {
        nodesId.push(parseInt(segments[i][j].end.identity));
        nodes.push({
          id: parseInt(segments[i][j].end.identity),
          name: segments[i][j].end.properties.KnowledgeName
        });
      }
      if (relationshipsId.indexOf(parseInt(segments[i][j].relationship.identity)) == -1) {
        relationshipsId.push(parseInt(segments[i][j].relationship.identity));
        relationships.push({
          source: parseInt(segments[i][j].start.identity),
          target: parseInt(segments[i][j].end.identity),
          label: segments[i][j].relationship.type
        });
      }
    }
  }
  resp.send({
    nodes: nodes,
    relationships: relationships
  });
})

module.exports = knowledgeManagement;