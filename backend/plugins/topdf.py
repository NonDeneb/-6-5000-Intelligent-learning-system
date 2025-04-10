import json
import sys
import re
import os
import shutil
import time

# '[{"name": "选择题","score": 6,"items": [{"name": "题目536","score": 6,"text": "一道考题有4个答案，要求学生将其中的一个正确答案选择出来。某考生知道正确答案的概率为\\(\\frac{1}{3}\\)，若不知正确答案，学生会乱猜。在乱猜时，4个答案被选择的概率均为\\(\\frac{1}{4}\\)，如果他答对了，则他确实知道正确答案的概率是","options": "\\frac{1}{3}||\\frac{2}{3}||\\frac{3}{4}||\\frac{1}{4}","images": []}],"title": "选择题：本题共1个小题，共6分"},{"name": "填空题","score": 0,"items": [],"title": "填空题：本题共0个小题，共0分"},{"name": "解答题","score": 38,"items": [{"name": "题目43","score": 4,"text": "1.已知抛物线\\( \\Gamma \\)：\\( y^2=2px(p>0) \\)的焦点为\\( F \\)、\\( P \\)是抛物线\\( \\Gamma \\)上一点，且在第一象限，满足\\( (2,2) \\)  （1）求抛物线\\( \\Gamma \\)的方程；    （2）已知经过点\\( A \\)\\( (3,2) \\)的直线交抛物线\\( \\Gamma \\)于\\( M、N \\)两点，经过定点\\( B \\)\\( (3,-6) \\)和\\( M \\)的直线与抛物线\\( \\Gamma \\)交于另一点\\( L \\)  ， 问直线\\( NL \\)是否恒过定点，如果过定点，求出该定点，否则说明理由．","options": "","images": []},{"name": "题目107","score": 10,"text": "如图，抛物线\\( y=\\frac{1}{5}x^2-\\frac{16}{5} \\)与x轴交与A,B两点，顶点为C，点P在抛物线上，且位于x轴下方。已知P(1,-3),B(4,0)，若点D是抛物线上的一点，满足\\( \\angle DPO=\\angle POB \\)，求点D的坐标。","options": "","images": [{"url": "288793-1630484678-2.jpg","width": "200px","height": ""}]},{"name": "题目118","score": 12,"text": "在\\(\\triangle ABC\\)中，角\\(A,B,C\\)对应的边分别为\\(a,b,c\\)且\\(b=1，c=\\sqrt{3},\\angle C=\\frac{2}{3}\\pi.\\)(1)求\\(cosB\\)的值.(2)求\\(a\\)的值","options": "","images": []},{"name": "题目524","score": 12,"text": "在\\(\\triangle ABC\\)中，角\\(A,B,C\\)对应的边分别为\\(a,b,c\\)且\\(b=1，c=\\sqrt{3},\\angle C=\\frac{2}{3}\\pi.\\)(1)求\\(cosB\\)的值.(2)求\\(a\\)的值","options": "","images": []}],"title": "解答题：本题共4个小题，共38分"}]'

questionImagesDir = r'/home/jiebinhuang/myproject/backend/public/questionImgs'
templateDir = r'/home/jiebinhuang/myproject/backend/plugins/pdfsource/gktemplate/'
title = sys.argv[1]
subTitle = sys.argv[2]
submitTime = sys.argv[3]
user = sys.argv[4]
questionData = json.loads(sys.argv[5])
isTemp = sys.argv[6]
outputDir = ''
filename = ''
pdfname = ''
if isTemp == '1':
  filename = user + '-' + str(submitTime) + '-' + 'compile.tex'
  pdfname = user + '-' + str(submitTime) + '-' + 'compile.pdf'
  outputDir = '/home/jiebinhuang/myproject/backend/public/temppdf/'
else:
  filename = user + '-' + str(submitTime) + title + '.tex'
  pdfname = user + '-' + str(submitTime) + title + '.pdf'
  outputDir = '/home/jiebinhuang/myproject/backend/public/papers/'

template = r'''\documentclass[12pt,twoside,space]{ctexart}
\usepackage{NEMT}
\usepackage{float}
\begin{document}\zihao{5}
\juemi
\biaoti{''' + title + r'''}
\fubiaoti{''' + subTitle + r'''}
{\heiti 注意事项}
\begin{enumerate}[itemsep=-0.3em,topsep=0pt]
\item 答卷前，考生务必将自己的姓名和准考证号填写在答题卡上。
\item 回答选择题时，选出每小题答案后，用铅笔把答题卡对应题目的答案标号涂黑。如需改动，用橡皮擦干净后，再选涂其它答案标号。回答非选择题时，将答案写在答题卡上。写在本试卷上无效。
\item 考试结束后，将本试卷和答题卡一并交回。
	请认真核对监考员在答题卡上所粘贴的条形码上的姓名、准考证号与您本人是否相符。
\end{enumerate}
'''

for eachType in questionData:
  if len(eachType['items']) == 0:
    continue
  template += r'\section{' + eachType['title'] + '}\n' + r'\begin{enumerate}[itemsep=0.2em,topsep=0pt]' + '\n'
  for q in eachType['items']:
    template += r'\item' + '\n' + q['text'].replace(r'\(', '$').replace(r'\)', '$') + '\n'
    if eachType['name'] == '选择题':
      options = q['options'].split('||')
      template += r'\begin{tasks}(' + str(len(options)) + ')'
      for o in options:
        template += r'\task $' + o.replace(r'\(', '$').replace(r'\)', '$') + '$ '
      template += '\n' + r'\end{tasks}' + '\n'
    if len(q['images']) > 0:
      template += r'''\begin{figure}[H]
                      \centering
                      '''
      for img in q['images']:
        shutil.copy(os.path.join(questionImagesDir, img['url']), templateDir)
        template += r'''\includegraphics[width=10em]{''' + img['url'] + '}\n'
      template += r'\end{figure}' + '\n'
  template += r'\end{enumerate}' + '\n'
template += r'''
\clearpage
\end{document}
\documentclass{article}
\usepackage{pdfpages}
\usepackage[paperwidth=39.5cm,paperheight=27.2cm]{geometry}
\begin{document}
\includepdf[pages=1-6,nup=2x1]{dibajiefeishujuesaijuanzi.pdf}
\end{document}
doublepages'''

with open(os.path.join(os.getcwd(), 'plugins/pdfsource/gktemplate/' + filename), 'w', encoding='utf-8') as f:
  f.write(template)

os.system('cd ' + templateDir + ' && ' + 'xelatex ' + filename + '&& ' + 'mv ' + pdfname + ' ' + outputDir)