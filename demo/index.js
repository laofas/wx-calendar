/**
 * 2018-09-09
 * document: https://github.com/shixianqin/wx-calendar
 */

import WxTouch from "../../src/wx-touch.js"
import createView from "./create-month-view.js"


/**
 * 全局变量
 * @type {Object}
 */
const STORE = {
		index: 0, // 当前视图的索引
		// top: 0, // 当前日期距离顶部的高度

		currentMonth: "", // 当前的月份，(年-月)
		prevMonth: "", // 基于当前月份的上一个月份，(年-月)
		nextMonth: "", // 基于当前月份的下一个月份，(年-月)

		currentWeek: "", // 当前星期的日期，(年-月-日)
		prevWeek: "", // 基于当前星期的上一个星期，(年-月-日)
		nextWeek: "", // 基于当前星期的下一个星期，(年-月-日)

		currentDay: 1, // 当前选择的 “日” 
		currentView: {}, // 当前视图的数据
		watchValue: false, // 是否启用监听 value 值变化
		changed: false, // 标记 swiper 是否改变
		matchDay: /\-\d+$/ // 匹配 “日”
	},

	/**
	 * 缓存数据对象
	 * @type {Object}
	 */
	CHACE = {},

	/**
	 * 规定对应索引的 “兄弟” 索引
	 * @type {Array}
	 */
	SIBLING = [{
		prev: 2,
		next: 1
	}, {
		prev: 0,
		next: 2
	}, {
		prev: 1,
		next: 0
	}];

/**
 * 获取单个 “月” 视图，并且缓存
 * @param  {String} date       传入年份+月份的字符串形式
 * @param  {Boolean} setCurrent 是否标记为当前数据
 * @return {Array}             日期数据列表
 */
function getMonthView(date, setCurrent) {
	let view = CHACE[date] || (CHACE[date] = createView(date));
	if (setCurrent) {
		STORE.currentView = view;
		STORE.currentMonth = date;
		STORE.prevMonth = view.prevYear + "-" + view.prevMonth;
		STORE.nextMonth = view.nextYear + "-" + view.nextMonth;
	}
	return view.view
}


/**
 * 刷新 “月” 视图
 * @param  {Stirng} date 传入年份+月份的字符串形式
 * @return {Object}      日期视图列表，3个
 */
function refreshMonthViews(date) {
	let views = [],
		sibling = SIBLING[STORE.index];

	// 标记每份数据应该存在的位置，这很重要
	views[STORE.index] = getMonthView(date, true);
	views[sibling.prev] = getMonthView(STORE.prevMonth);
	views[sibling.next] = getMonthView(STORE.nextMonth);

	return {
		views
	}
}


/**
 * 改变 “月” 视图
 * @param  {Number} index 当前的 swiper 索引
 * @return {Object}       直接设置返回的数据
 */
function changeMonthViews(index) {
	let info = getChangeInfo(index),
		month = info.direction + "Month";

	// 设置为当前数据
	getMonthView(STORE[month], true);

	return {
		["views[" + info.index + "]"]: getMonthView(STORE[month]) // 修改对应的数据
	}
}


/**
 * 获取日期相差的日期，计算 “周”
 * @param  {String} date 年-月-日
 * @param  {Number} diff 相差数，一周，就是 7 天，上或下用正负表示
 * @return {String}      计算相差后的日期
 */
function getDiffDate(date, diff) {

	// 把 “日” 转换为数字，因为它需要计算
	let value = date.split("-").map((item, index) => {
		return index == 2 ? parseInt(item) + diff : item;
	});

	date = new Date(value[0], value[1] - 1, value[2]);

	return [
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate()
	].join("-")
}


/**
 * 获取当前选择的日期距离顶部的高度
 * @param  {Array} view 当前的日期视图列表
 * @param  {String} date 当前旋转的日期，年-月-日
 * @return {Number}      
 */
function getTop(view, date) {
	let grid42 = view.length == 42,
		value = Math.floor(view.findIndex(item => item.date == date) / 7) * (grid42 ? 95 : 120);
	return grid42 && value == 475 || value == 480 ? value + 1 : value;
}


/**
 * 获取单个 “周” 视图
 * @param  {String} date       年-月-日
 * @param  {Boolean} setCurrent 是否标记为当前数据
 * @return {Object}            view: 日期视图数据，top: 距离顶部的高度
 */
function getWeekView(date, setCurrent) {
	let view = getMonthView(date.replace(STORE.matchDay, ""), setCurrent),
		top = getTop(view, date);
	if (setCurrent) {
		STORE.currentWeek = date;
		STORE.prevWeek = getDiffDate(date, -7);
		STORE.nextWeek = getDiffDate(date, 7);
		STORE.currentDay = parseInt(date.split("-")[2]);
	}
	return {
		view,
		top: -top
	}
}


/**
 * 刷新 “周” 视图
 * @param  {String} date 年-月-日
 * @return {Object}      直接设置返回的数据
 */
function refreshWeekViews(date) {
	let views = [],
		topValues = [],
		sibling = SIBLING[STORE.index],
		current = getWeekView(date, true),
		prev = getWeekView(STORE.prevWeek),
		next = getWeekView(STORE.nextWeek);

	// 标记每份数据应该存在的位置，这很重要
	views[STORE.index] = current.view;
	views[sibling.prev] = prev.view;
	views[sibling.next] = next.view;

	// 标记每份数据应该存在的位置，这很重要
	// 每一个视图相对于顶部的高度
	topValues[STORE.index] = current.top;
	topValues[sibling.prev] = prev.top;
	topValues[sibling.next] = next.top;

	return {
		views,
		topValues
	}
}


/**
 * 改变 “周” 视图
 * @param  {Number} index 当前 swiper 的索引
 * @return {Object}       直接设置返回的数据
 */
function changeWeekViews(index) {
	let info = getChangeInfo(index),
		week = info.direction + "Week",

		// 标记当前数据
		view = getWeekView(STORE[week], true),

		// 修改对应的数据
		siblingView = getWeekView(STORE[week]);

	return {
		["views[" + info.index + "]"]: siblingView.view,
		["topValues[" + info.index + "]"]: siblingView.top
	}
}


/**
 * 获取今天的日期
 * @return {Array} 年，月，日
 */
function getToday() {
	let date = new Date();
	return [
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate()
	]
}


/**
 * 获取改变状态信息
 * @param  {Number} currentIndex 当前的 swiper 索引
 * @return {Object}              滑动方向和对应需改变的索引
 */
function getChangeInfo(currentIndex) {
	let direction = SIBLING[STORE.index].next == currentIndex ? "next" : "prev";
	return {
		direction,
		index: SIBLING[currentIndex][direction]
	}
}


/**
 * 转换传递的日期为数字，并且标记当前的 “日”
 * @param  {String} date 年-月-日
 * @return {String}      年-月
 */
function getValue(date) {
	let value = date ? date.split("-").map(Number) : getToday();
	if (value.length > 2) {
		STORE.currentDay = value.pop();
	}
	return value.join("-")
}


/**
 * 注册组件
 */
Component({
	properties: {
		value: {
			type: String,
			observer(value) {
				if (STORE.watchValue) {
					this.watchValue(value);
				}
			}
		},
		viewType: {
			type: String,
			value: "month"
		}
	},

	data: {
		weekLabel: ["日", "一", "二", "三", "四", "五", "六"],
		views: [],
		currentIndex: 0,
		viewIndex: 0,
		// height: 600,
		topValues: [0, 0, 0],
		currentDate: "",
		animate: "",
	},


	attached() {
		this.watchValue(this.data.value);
		STORE.watchValue = true;
	},


	methods: {
		swiperChange(evt) {
			STORE.changed = true;
		},

		swiperFinish(evt) {
			if (STORE.changed) {
				let index = evt.detail.current,
					isMonthView = this.data.viewType == "month",
					setData = isMonthView ? changeMonthViews(index) : changeWeekViews(index);
				setData.viewIndex = index;
				this.setData(setData);
				if (evt.detail.source == "touch") {
					this.setDate(isMonthView ? "auto" : STORE.currentWeek);
				}
				STORE.index = index;
				STORE.changed = false;
			}
		},

		selectDate(evt) {
			let setData = {},
				data = evt.currentTarget.dataset.data,
				date = data.date,
				isWeekView = this.data.viewType == "week";

			if (data.type != "current") {
				if (isWeekView) {
					setData = refreshWeekViews(date);
					setData.animate = "";
				} else {
					setData.currentIndex = SIBLING[STORE.index][data.type]
				}
				this.setData(setData);
			}
			if (isWeekView) {
				STORE.prevWeek = getDiffDate(date, -7);
				STORE.nextWeek = getDiffDate(date, 7);
			}
			this.setDate(date);
		},

		setDate(date) {
			if (date == "auto") {
				if (STORE.currentDay > STORE.currentView.totalDay) {
					STORE.currentDay = STORE.currentView.totalDay;
				}
				date = STORE.currentMonth + "-" + STORE.currentDay;
			}
			this.setData({
				currentDate: date
			});
			this.triggerEvent("change", {
				value: date
			});
		},


		watchValue(date) {
			this.setData(this.data.viewType == "month" ? refreshMonthViews(getValue(date)) : refreshWeekViews(date));
			this.setDate("auto");
		},


		/**
		 * 自定义手势事件
		 */
		...WxTouch("Touch", {
			swipeVelocity: false,

			pressmove(evt) {
				// if (!STORE.pressmoved) {
				// 	STORE.top = -getTop(STORE.currentView.view, this.data.currentDate);
				// 	STORE.height = this.data.height;
				STORE.pressmoved = true;
				// 	this.setData({
				// 		animate: ""
				// 	})
				// }

				// let y = evt.deltaY,
				// 	height = y > 0 ? (STORE.height + y > 600 ? 600 : STORE.height + y) : STORE.height + y < 120 ? 120 : STORE.height + y,
				// 	top = y > 0 ? (STORE.top + y > 0 ? 0 : STORE.top + y) : y < STORE.top ? STORE.top : y;

				// this.setData({
				// 	height,
				// 	["topValues[" + STORE.index + "]"]: top
				// })
			},

			swipe(evt) {
				if (STORE.pressmoved) {

					let data = {};

					if (evt.direction == "up") {
						data = refreshWeekViews(this.data.currentDate);
						data.viewType = "week";
						// data.height = 120;
					} else {
						data = refreshMonthViews(this.data.currentDate);
						data.viewType = "month";
						// data.height = 600;
						data.topValues = [0, 0, 0];
					}

					data.animate = "animate";

					this.setData(data);

					STORE.pressmoved = false;
				}
			}
		})
	}
})
