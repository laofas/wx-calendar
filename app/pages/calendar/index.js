import Calendar from "./calendar.js"
import WxTouch from "./wx-touch.js"

Component({
    properties: {
        value: {
            type: String,
            observer(value, oldValue, path) {
                // 监听 value 值变化
                if (this.calendar.watchValue && value != this.data.currentDate) {
                    this.watchValue(value);
                }
            }
        },

        // 视图类型
        viewType: {
            type: String,
            value: "month" // week
        },

        // 指示灯
        indicator: Object
        // value: {
        //     "2018-9-8": 1,
        //     "2018-9-9": 2,
        //     "2018-9-10": 1,
        //     "2018-9-11": 1,
        //     "2018-9-12": 2
        // }
    },

    data: {
        weekLabel: ["日", "一", "二", "三", "四", "五", "六"],
        views: [], // 视图组
        currentIndex: 0, // 当前索引，控制 swiper
        viewIndex: 0, // 当前索引，不控制 swiper
        hideEdge: "", // 是否隐藏边缘，因为 42 格子的周视图，会漏出相邻日期的激活状态样式
        topValues: [0, 0, 0], // 控制周视图的隐藏高度
        currentDate: "", // 标记今天
        animate: "", // 切换周月视图时开启动画过渡
    },

    /**
     * 初始化控制器
     */
    created() {
        this.calendar = new Calendar();
    },

    /**
     * 初始化视图
     */
    attached() {
        this.watchValue(this.data.value);
        this.calendar.watchValue = true;

        // 隐藏边缘
        if (this.data.viewType == "week") {
            this.setData({
                hideEdge: "hide-edge"
            })
        }
    },


    methods: {
        /**
         * 监听 swiper 改变
         */
        swiperChange(evt) {
            let index = evt.detail.current,
                calendar = this.calendar,

                // 根据视图类型使用不同的刷新机制
                data = this.data.viewType == "week" ?
                calendar.changeWeekViews(index) :
                calendar.changeMonthViews(index);

            // 更新视图索引的标记，仅仅是标记
            data.viewIndex = index;

            this.setData(data);

            // 保存当前索引到实例
            calendar.index = index;

            // 标记视图已经发送变化
            calendar.changed = true;
        },

        /**
         * swiper 滑动结束
         */
        swiperFinish(evt) {
            let calendar = this.calendar;

            // 当视图发送变化，才会执行
            if (calendar.changed) {

                // 滑动结束后，自动设置日期
                if (evt.detail.source == "touch") {
                    this.setDate(this.data.viewType == "week" ? calendar.currentWeek : "auto");
                }

                // 重置标记
                calendar.changed = false;
            }
        },

        // 切换的过渡完成后，是否隐藏边缘
        // 当为周视图的时候，边缘可能会漏出其他日期的样式
        transitionEnd() {
            this.setData({
                hideEdge: this.data.viewType == "week" ? "hide-edge" : ""
            })
        },

        // 点击选择某个日期
        selectDate(evt) {
            let data = {},
                item = evt.currentTarget.dataset.data,
                date = item.date,
                calendar = this.calendar,
                isWeekView = this.data.viewType == "week";

            if (item.type != "current") {

                // 如果选择的不是当前视图月份的日期，那么就切换
                // 点击上一个月或者下一个月的日期，不会产生动画过渡，但是数据会变化
                if (isWeekView) {
                    data = calendar.refreshWeekViews(date);
                    data.animate = "";
                } else {
                    // 切换视图位置，点击上一个月或者下一个月的日期，会产生过渡变化
                    data.currentIndex = calendar.SIBLING[calendar.index][item.type];
                }
                this.setData(data);
            }

            // 周视图下选择日期，要同时更新下一个星期和上一个星期的值
            if (isWeekView) {
                calendar.prevWeek = calendar.getDiffDate(date, -7);
                calendar.nextWeek = calendar.getDiffDate(date, 7);
            }

            // 保存当前选择的 “日”
            calendar.currentDay = date.split("-")[2];

            this.setDate(date);
        },

        /**
         * 设置激活日期状态，上传事件
         */
        setDate(date) {
            if (date == "auto") {
                let calendar = this.calendar;

                // 自动灵活设置日期
                // 比如现在选择的是31号，切换到2月份，会自动选择 28 或者 29，因为2月份没有31号
                if (calendar.currentDay > calendar.currentView.totalDay) {
                    calendar.currentDay = calendar.currentView.totalDay;
                }
                date = calendar.currentMonth + "-" + calendar.currentDay;
            }

            this.setData({
                currentDate: date
            });

            if (this.calendar.watchValue) {

                // 上传 change 事件
                this.triggerEvent("change", {
                    value: date
                })
            }
        },

        /**
         * 监听 value 值变化
         */
        watchValue(date) {
            let calendar = this.calendar,
                value = calendar.getValue(date);

            // 根据视图类型使用不同的刷新机制
            this.setData(
                this.data.viewType == "month" ?
                calendar.refreshMonthViews(value.month) :
                calendar.refreshWeekViews(value.date)
            );

            this.setDate("auto");
        },


        /**
         * 自定义手势事件
         */
        ...WxTouch("Touch", {
            swipeVelocity: false,

            pressmove(evt) {
                this.calendar.pressmoved = true;
            },

            swipe(evt) {
                let setData = {},
                    data = this.data,
                    trigger = false,
                    calendar = this.calendar;

                if (calendar.pressmoved) {

                    // 向上滑动更新为 “周” 视图，向下为 “月” 视图
                    if (evt.direction == "up" && data.viewType == "month") {
                        setData = calendar.refreshWeekViews(data.currentDate);
                        setData.viewType = "week";
                        trigger = true;
                    } else if (evt.direction == "down" && data.viewType == "week") {
                        setData = calendar.refreshMonthViews(calendar.currentMonth);
                        setData.viewType = "month";
                        setData.topValues = [0, 0, 0];
                        trigger = true;
                    }

                    setData.animate = "animate";

                    this.setData(setData);

                    // 切换视图后上传事件
                    if (trigger) {
                        this.triggerEvent("viewchange", {
                            viewType: setData.viewType
                        })
                    }

                    calendar.pressmoved = false;
                }
            }
        })
    }
})