// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    homeworkIndex: 0,
    classIndex: 0,
    studentIndex: 0,
    studentData: [],
    classData: [],
    homeworkData: [],
	classes: [],
	homeworks: [],
	students: [],
	homeworkId: 0
  },
  onShow () {
      console.log(app.globalData.userName)
      wx.request({
        url: 'http://222.201.80.154:8889/user/miniprogram/requireClassData',
        success: res => {
          // console.log(res)
          this.setData({
			classes: res.data,
			classData: []
          })
		  for(let i = 0; i < this.data.classes.length; i++) {
		  	this.data.classData.push({id: i, name: this.data.classes[i]})
		  }
		  this.setData({
			  classData: this.data.classData
		  })
		  // console.log(this.data.classData)
		  wx.request({
		  		  url: 'http://222.201.80.154:8889/user/miniprogram/requirehomework',
		  		  data: {
		  			  classname: this.data.classes[this.data.classIndex]
		  		  },
		  		  success: res => {
		  			  this.setData({
		  				  homeworks: res.data.homeworkname,
		  				  students: res.data.students,
						  homeworkData: [],
						  studentData: []
		  			  })
		  			  for(let i = 0; i < this.data.homeworks.length; i++) {
		  			  	this.data.homeworkData.push({id: i, homeworkName: this.data.homeworks[i], homeworkId: res.data.homeworkid[i] })
		  			  }
		  			  for(let i = 0; i < this.data.students.length; i++) {
		  			  	this.data.studentData.push({id: i, studentName: this.data.students[i]})
		  			  }
		  			  this.setData({
		  				  homeworkData: this.data.homeworkData,
		  				  studentData: this.data.studentData,
						  homeworkId: res.data.homeworkid
		  			  })
		  		  }
		  })
        }
      })
	  // console.log('test',this.data.classes)
  },
  changePaper (e) {
    this.setData({
      homeworkIndex: e.detail.value
    })
  },
  changeClass (e) {
	  this.setData({
	    classIndex: e.detail.value
	  })
	  wx.request({
			  url: 'http://222.201.80.154:8889/user/miniprogram/requirehomework',
			  data: {
				  classname: this.data.classes[this.data.classIndex]
			  },
			  success: res => {
				  this.setData({
					  homeworks: res.data.homeworkname,
					  students: res.data.students
				  })
				  this.data.homeworkData = []
				  this.data.studentData = []
				  for(let i = 0; i < this.data.homeworks.length; i++) {
					this.data.homeworkData.push({id: i, homeworkName: this.data.homeworks[i], homeworkId: res.data.homeworkid[i] })
				  }
				  for(let i = 0; i < this.data.students.length; i++) {
					this.data.studentData.push({id: i, studentName: this.data.students[i]})
				  }
				  this.setData({
					  homeworkData: this.data.homeworkData,
					  studentData: this.data.studentData
				  })
			  }
	  })
  },
  changeStudent (e) {
    this.setData({
      studentIndex: e.detail.value
    })
  },
  openScan(){
    wx.navigateTo({
      url: '/pages/camera/camera',
      success: res => {
        res.eventChannel.emit('sendHomeworkData', {
          homeworkId: this.data.homeworkData[this.data.homeworkIndex].homeworkId,
          classId: this.data.classData[this.data.classIndex].name,
          studentId: this.data.studentData[this.data.studentIndex].studentName
        })
      }
    })
	console.log('hid',this.data.homeworkData[this.data.homeworkIndex].homeworkId)
  }
})
