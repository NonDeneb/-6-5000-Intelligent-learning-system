// pages/mydata/mydata.js
import * as echarts from '../../ec-canvas/echarts'

function initChart(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr // 像素
    });
    canvas.setChart(chart);
  
    var option = {
        title: {
            text: '优劣知识点'
        },
        legend: {
            data: [
                '优势知识点',
                '劣势知识点'
            ]
        },
        radar: [
            // shape: 'circle',
            {
                indicator: [
                    { name: '集合', max: 100 },
                    { name: '一元二次不等式', max: 100 },
                    { name: '一元二次方程', max: 100 },
                    { name: '参数方程', max: 100 },
                    { name: '极坐标方程', max: 100 },
                    { name: '直线方程', max: 100 }
                ],
                radius: 60,
                center: ['50%', '25%']
    
            }, {
                indicator: [
                    { text: '数列', max: 100 },
                    { text: '立体几何', max: 100 },
                    { text: '导数', max: 100 },
                    { text: '斜率', max: 100 },
                    { text: '函数单调性', max: 100 }
                ],
                radius: 60,
                center: ['50%', '75%']
            },
        ],
        series: [{
                type: 'radar',
                tooltip: {
                    trigger: 'item'
                },
                areaStyle: {},
                data: [{
                    value: [60, 73, 85, 76, 60, 80],
                    name: '优势'
                }]
            },
            {
                type: 'radar',
                radarIndex: 1,
                areaStyle: {},
                data: [{
                    value: [12, 35, 14, 23, 21],
                    name: '劣势'
                }]
            }
        ]
    }
    chart.setOption(option);
    return chart;
  }

  function initChart1(canvas, width, height, dpr) {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr // 像素
    });
    canvas.setChart(chart);
  
    var option = {
        title: {
          text: '平均成绩分布统计',
          top: '5%',
          left: '2%'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '30%',
          right: '0',
          orient: 'vertical',
          icon: 'circle'
        },
        series: [
          {
            name: '成绩分布',
            type: 'pie',
            left: '-30%',
            radius: ['40%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: 'true',
              position: 'center',
              formatter: '总人数\n\n42',
              fontSize: 16
            },
            data: [
              { value: 35, name: '优秀(90-100)' },
              { value: 10, name: '良好(80-90)' },
              { value: 40, name: '中等(60-80)' },
              { value: 60, name: '继续努力(0-60)' }
            ]
          }
        ]
      }
    chart.setOption(option);
    return chart;
  }

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
    title: '我的数据',
    ec: {
        onInit: initChart
    },
    ec1: {
        onInit: initChart1
    }
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