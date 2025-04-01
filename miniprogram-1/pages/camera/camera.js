// pages/camera/camera.js
Page({
    data: {
      // 状态栏高度
      statusBarHeight: wx.getStorageSync('statusBarHeight') + 'px',
      // 导航栏高度
      navigationBarHeight: wx.getStorageSync('navigationBarHeight') + 'px',
      // 胶囊按钮高度
      menuButtonHeight: wx.getStorageSync('menuButtonHeight') + 'px',
      // 导航栏和状态栏高度
      navigationBarAndStatusBarHeight:
        wx.getStorageSync('statusBarHeight') +
        wx.getStorageSync('navigationBarHeight') +
        'px',
      tempImagePath: '',
      currentImages: [],
      homeworkId: '',
      splitRes: [],
      classId: '',
      studentId: '',
	  className: '',
	  studentName: ''
    },
    onLoad () {
      const eventChannel = this.getOpenerEventChannel()
      const that = this
      eventChannel.on('sendHomeworkData', function(data) {
        that.setData({
          // homeworkId: data.homeworkId,
          homeworkId: data.homeworkId,
          classId: data.classId,
          studentId: data.studentId
        })
      })
	  console.log(this.data)
    },
    takePhoto() {
      const ctx = wx.createCameraContext();
      ctx.takePhoto({
        quality: 'high',
        success: (res) => {
          this.setData({
            tempImagePath: res.tempImagePath,
            currentImages: this.data.currentImages.concat(res.tempImagePath)
          })
          console.log(this.data.currentImages)
        }
      });
      // wx.redirectTo({
      //   url: '/pages/result/result',
      // })
    },
    returnBack(){
      wx.navigateBack({
        delta: 0,
      })
    },
    error(e) {
      console.log(e.detail)
    },
    chooseimage: function () {
      var that = this;
      wx.chooseImage({
        count: 1, // 默认9  
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有  
        sourceType: ['album'], // 可以指定来源是相册还是相机，默认二者都有  
        success: function (res) {
          // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片  
          that.setData({
            tempImagePath: res.tempFilePaths,
            currentImages: that.data.currentImages.concat(res.tempFilePaths)
          })
        }
      })
    },
    removePicture (e) {
      this.data.currentImages.splice(this.data.currentImages.indexOf(e.target.dataset.picurl), 1)
      this.setData({
        currentImages: this.data.currentImages
      })
    },
    submit () {
      wx.showLoading({
        title: '上传图片中',
        mask: true
      })
	  this.setData({
		  splitRes:[]
	  })
      this.recuUpload(this.data.currentImages, 0, this.data.currentImages.length)
    },
    recuUpload (filesArr, index, length) {
      if (index > length - 1) {
        wx.hideLoading()
        const flatten = []
        this.data.splitRes.forEach(item => {
          item.forEach(item2 => {
            flatten.push(item2)
          })
        })
        wx.navigateTo({
          url: '/pages/result/result',
          success: res => {
            res.eventChannel.emit('sendSplitData', {
              splitData: flatten,
              homeworkId: this.data.homeworkId,
              classId: this.data.classId,
              studentId: this.data.studentId
            })
          }
        })
        return
      }
      const that = this
      const username = getApp().globalData.userName
      wx.uploadFile({
        filePath: filesArr[index],
        name: 'file',
        formData: {
          username: username,
          homeworkId: this.data.homeworkId,
          classId: this.data.classId,
          studentId: this.data.studentId
        },
        url: 'http://222.201.80.154:8889/user/miniprogram/uploadTempFile',
        success: function (res) {
          console.log(JSON.parse(res.data).splitData)
          const splitRes = that.data.splitRes
          splitRes.push(JSON.parse(res.data).splitData)
          that.setData({
            splitRes: splitRes
          })
          that.recuUpload(filesArr, ++index, length)
        }
      })
    }
  })
  