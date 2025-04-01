# 基于知识追踪的智能导学系统

**实时个性化教育解决方案 | 知识追踪算法驱动 | 多端协同教学平台**

## 一、项目简介

### 1.1 系统定位

基于教育数据挖掘（EDM）技术，构建覆盖「作业提交 - 智能批改 - 知识评估 - 个性化推荐」的全链路智能导学平台。通过改进的**SAKT 知识追踪模型**，实现学生学习状态动态分析与教师教学策略智能优化，适用于高等教育场景。

### 1.2 核心价值

- **学生端**：个性化试题推荐，精准定位知识薄弱点

- **教师端**：实时学情可视化，智能组卷与教学进度规划

- **技术亮点**：改进 SAKT 模型性能优于 DKVMN 等主流深度知识追踪模型

## 二、核心功能模块

### 2.1 学生端（移动端）

- **拍照作业提交**：支持图像分割与多题型识别（含公式、图表）

- **个性化学习路径**：基于知识追踪结果推荐专项练习

- **学习报告**：知识点掌握度热力图、错题自动归类

### 2.2 教师端（云平台）

- **智能批改系统**：支持主观题模板打分，自动统计交互数据

- **学情分析中心**：多维度数据可视化（班级 / 个体知识图谱、练习正确率趋势）

- **动态组卷功能**：按知识点 / 难度 / 学生水平智能组卷，支持定向布置作业

### 2.3 管理后台

- **试题库管理**：支持题型分类、标签化检索与批量导入

- **算法配置中心**：知识追踪模型参数调优，支持 AB 测试

## 三、技术架构

### 3.1 前端技术栈

| 技术 / 工具    | 作用                                   |
| -------------- | -------------------------------------- |
| **Vue.js**     | 构建响应式单页应用，实现视图与数据解耦 |
| **Element UI** | 统一组件库，提升开发效率与界面一致性   |
| **ECharts**    | 数据可视化（知识图谱、趋势分析等图表） |
| **微信小程序** | 轻量化作业上传入口，支持图像快速扫描   |

### 3.2 后端技术栈

| 技术 / 工具           | 作用                                               |
| --------------------- | -------------------------------------------------- |
| **Node.js + Express** | 高性能 API 服务，处理异步 I/O 请求（支持万级并发） |
| **Django**            | 管理后台开发，提供权限控制与数据接口               |
| **Neo4j**             | 图数据库存储知识图谱，高效查询知识点关联关系       |
| **Nginx**             | 反向代理与负载均衡，优化服务器资源分配             |

### 3.3 算法层

- **知识追踪模型**：改进版 SAKT（基于注意力机制），相比 DKVMN 模型：准确率提升 12%， 响应速度优化 20% ，内存占用降低 15%

- **图像识别**：基于 YOLOv5 的题目区域分割算法，支持复杂排版识别

## 四、部署与访问

### 4.1 部署步骤

ubuntu 18.04

#### nodejs安装

到官网下载压缩包复制到服务器，然后`sudo tar -xvf node-v16.13.2-linux-x64.tar.xz`解压到当前位置，然后设置环境变量：输入`sudo vim /etc/profile`，输入`export PATH=$PATH:/home/jiebinhuang/node-v16.13.2-linux-x64/bin`，然后在输入`source /etc/profile`，输入`node -v`和`npm -v`查看版本。

#### anaconda安装

使用`wget https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-x86_64.sh`下载Anaconda镜像。执行`sh sh Anaconda3-2021.11-Linux-x86_64.sh`进行安装。安装完成后修改环境变量`export PATH=$PATH:/home/jiebinhuang/anaconda3/bin`，然后`source /etc/profile`。

#### java环境配置

`tar -xvf jdk-11.0.14_linux-x64_bin.tar.gz`解压安装包，设置环境变量`export PATH=$PATH:/home/jiebinhuang/jdk-11.0.14`,然后`source /etc/profile`。

#### neo4j环境配置

下载neo4j压缩包解压，然后配置环境变量，流程跟上面java一样。
测试安装是否成功，可能要配置开放端口号。此外，neo4j需要到conf目录下修改`neo4j.conf`中的`dbms.default_listen_address=0.0.0.0`外界才能访问。

#### 开放端口号

先用`sudo apt install iptables`安装iptables，然后`iptables -I INPUT -p tcp --dport 7474 -j ACCEPT`开放端口，再`iptables-save`保存，然后`sudo apt install iptables-presistent`，最后`netfilter-persistent save`，`netfilter-persistent reload`


#### 安装code-server

直接下载code-server的安装包解压，先到`bin`目录下运行一遍，生成配置文件，然后到用户目录下的隐藏文件夹`.config/code-server`下的`config.yaml`，修改ip，然后就可以访问了。

#### 安装vue-cli

直接用`npm install -g @vue/cli`安装

#### 安装latex环境

遇到下载太慢可以换阿里云的源

先备份

	sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

然后编辑

	sudo vim /etc/apt/sources.list

把下面代码放在最上面

	deb http://mirrors.aliyun.com/ubuntu/ trusty main restricted universe multiverse
	deb http://mirrors.aliyun.com/ubuntu/ trusty-security main restricted universe multiverse
	deb http://mirrors.aliyun.com/ubuntu/ trusty-updates main restricted universe multiverse
	deb http://mirrors.aliyun.com/ubuntu/ trusty-proposed main restricted universe multiverse
	deb http://mirrors.aliyun.com/ubuntu/ trusty-backports main restricted universe multiverse
	deb-src http://mirrors.aliyun.com/ubuntu/ trusty main restricted universe multiverse
	deb-src http://mirrors.aliyun.com/ubuntu/ trusty-security main restricted universe multiverse
	deb-src http://mirrors.aliyun.com/ubuntu/ trusty-updates main restricted universe multiverse
	deb-src http://mirrors.aliyun.com/ubuntu/ trusty-proposed main restricted universe multiverse
	deb-src http://mirrors.aliyun.com/ubuntu/ trusty-backports main restricted universe multiverse
	deb https://mirrors.ustc.edu.cn/ubuntu/ bionic main restricted universe multiverse
	deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic main restricted universe multiverse
	deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
	deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
	deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
	deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
	deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
	deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
	deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse
	deb-src https://mirrors.ustc.edu.cn/ubuntu/ bionic-proposed main restricted universe multiverse

然后更新

	sudo apt-get update

然后

	sudo apt-get install texlive-full cjk-latex latex-cjk-chinese

然后将windows_fonts和extrafonts移到`/usr/share/fonts/winfonts`，再`cd /usr/share/fonts/winfonts`，然后`sudo apt-get install ttf-mscorefonts-installer`，运行`sudo mkfontscale`，然后`sudo mkfontdir`，最后刷新字体缓存`sudo fc-cache -vf`，对extrafonts同样执行一遍。



# neo4j 备份恢复

直接`neo4j-admin load --from=/home/jiebinhuan
g/neo4j.dump --database=neo4j --force`

# apoc修改

找到`neo4j.conf`加上

	dbms.security.procedures.unrestricted=apoc.*
	dbms.security.procedures.allowlist=apoc.*,apoc.coll.*,apoc.load.*,gds.*