// pages/setting/setting.js
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
        wx.getStorageSync('navigationBarHeight'),
      title: '设置'
    },
  
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
  
    },
  
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
  
    },
  
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
  
    },
  
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
  
    },
  
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
  
    },
  
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
  
    },
  
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
  
    },
  
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
  
    },
    returnBack() {
      wx.navigateBack({
        delta: 0,
      })
    }
  })