// pages/result/result.js
Page({

  /**
   * 页面的初始数据
   */
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
    title: '扫描结果',
    splitData: [],
    homeworkId: '',
    classId: '',
    studentId: '',
	className: '',
	studentName: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const eventChannel = this.getOpenerEventChannel()
      const that = this
      eventChannel.on('sendSplitData', function(data) {
        that.setData({
          splitData: data.splitData,
          homeworkId: data.homeworkId,
          classId: data.classId,
          studentId: data.studentId
        })
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  preview (e) {
    console.log(e);
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: [ e.currentTarget.dataset.url ]
    })
  },
  submit () {
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    wx.request({
      url: 'http://222.201.80.154:8889/user/miniprogram/submitHomework',
      method: 'POST',
      data: {
        splitData: this.data.splitData,
        homeworkId: this.data.homeworkId,
        classId: this.data.classId,
        studentId: this.data.studentId
      },
      success: res => {
        wx.hideLoading()
        wx.navigateBack({
          delta: 0,
        })
      }
    })
  },
  returnBack() {
    wx.navigateBack({
      delta: 0,
    })
  }
})